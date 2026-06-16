"""
Test runner for the Infant Mortality Predictor API
Run this script to test all cases against the API endpoint
Includes output validation and correctness checks
"""

import requests
import json
from test_cases import test_cases

API_URL = "http://localhost:8000/predict"

# Expected results for each test case
EXPECTED_RESULTS = {
    "low_risk": {
        "prediction": "Low Risk",
        "risk_range": (0, 0.33),
        "description": "Low-risk scenario with favorable conditions"
    },
    "high_risk": {
        "prediction": "High Risk",
        "risk_range": (0.67, 1.0),
        "description": "High-risk scenario with adverse conditions"
    },
    "mixed_risk_teenage_mother": {
        "prediction": "Low Risk",  # Mixed but should lean low
        "risk_range": (0, 0.4),
        "description": "Teenage mother with institutional support"
    },
    "mixed_risk_older_mother": {
        "prediction": "Low Risk",
        "risk_range": (0, 0.33),
        "description": "Older multiparous mother with resources"
    },
    "high_risk_minimal_care": {
        "prediction": "High Risk",
        "risk_range": (0.67, 1.0),
        "description": "Very limited healthcare access"
    },
    "optimal_conditions": {
        "prediction": "Low Risk",
        "risk_range": (0, 0.25),
        "description": "Best-case scenario"
    },
}

class TestResult:
    def __init__(self, case_name):
        self.case_name = case_name
        self.status = "PASS"
        self.errors = []
        self.warnings = []
        self.data = {}
    
    def add_error(self, msg):
        self.status = "FAIL"
        self.errors.append(msg)
    
    def add_warning(self, msg):
        self.warnings.append(msg)
    
    def print_result(self):
        status_symbol = "✓" if self.status == "PASS" else "✗"
        print(f"\n{status_symbol} {self.case_name.upper()}: {self.status}")
        
        if self.data:
            print(f"  Prediction: {self.data.get('prediction')} | Risk: {self.data.get('risk_of_death')*100:.1f}%")
        
        if self.errors:
            for error in self.errors:
                print(f"  ✗ ERROR: {error}")
        
        if self.warnings:
            for warning in self.warnings:
                print(f"  ⚠ WARNING: {warning}")

def validate_output(case_name, response_data, expected):
    """Validate API output against expected results"""
    result = TestResult(case_name)
    result.data = response_data
    
    # 1. Validate structure
    required_fields = ['prediction', 'risk_of_death', 'model_score', 'top_factors']
    for field in required_fields:
        if field not in response_data:
            result.add_error(f"Missing required field: {field}")
    
    if result.status == "FAIL":
        return result
    
    # 2. Validate data types and ranges
    try:
        risk_score = float(response_data['risk_of_death'])
        model_score = float(response_data['model_score'])
        prediction = str(response_data['prediction'])
        top_factors = list(response_data['top_factors'])
    except (ValueError, TypeError) as e:
        result.add_error(f"Invalid data types: {str(e)}")
        return result
    
    # 3. Check score ranges (0-1)
    if not (0 <= risk_score <= 1):
        result.add_error(f"Risk score out of range [0,1]: {risk_score}")
    
    if not (0 <= model_score <= 1):
        result.add_error(f"Model score out of range [0,1]: {model_score}")
    
    # 4. Check prediction matches expected
    if prediction != expected['prediction']:
        result.add_error(
            f"Wrong prediction: got '{prediction}', expected '{expected['prediction']}'"
        )
    
    # 5. Check risk score is in expected range
    min_expected, max_expected = expected['risk_range']
    if not (min_expected <= risk_score <= max_expected):
        result.add_error(
            f"Risk score {risk_score:.3f} outside expected range [{min_expected}, {max_expected}]"
        )
    
    # 6. Validate prediction-score consistency
    if prediction == "Low Risk" and risk_score >= 0.33:
        result.add_error("Inconsistent: 'Low Risk' but risk_score >= 0.33")
    
    if prediction == "Moderate Risk" and (risk_score < 0.33 or risk_score >= 0.67):
        result.add_error("Inconsistent: 'Moderate Risk' but risk_score outside [0.33, 0.67)")
    
    if prediction == "High Risk" and risk_score < 0.67:
        result.add_error("Inconsistent: 'High Risk' but risk_score < 0.67")
    
    # 7. Validate top factors structure
    if len(top_factors) == 0:
        result.add_warning("No top factors returned")
    else:
        for i, factor in enumerate(top_factors):
            if not all(k in factor for k in ['feature', 'impact', 'direction']):
                result.add_error(f"Factor {i} missing required fields")
            
            if factor['direction'] not in ["Increased Risk", "Reduced Risk"]:
                result.add_error(f"Factor {i} has invalid direction: {factor['direction']}")
            
            if not (0 <= factor['impact'] <= 1):
                result.add_warning(f"Factor {i} impact outside typical range: {factor['impact']}")
    
    return result

def run_tests():
    print("\n" + "="*80)
    print("INFANT MORTALITY PREDICTOR - COMPREHENSIVE TEST SUITE")
    print("="*80 + "\n")
    
    results = []
    response_times = {}
    
    for case_name, case_data in test_cases.items():
        print(f"\nTesting: {case_name.upper()}")
        print(f"Description: {EXPECTED_RESULTS[case_name]['description']}")
        print("-" * 80)
        
        try:
            import time
            start_time = time.time()
            response = requests.post(API_URL, json=case_data)
            response_times[case_name] = time.time() - start_time
            
            if response.status_code == 200:
                result_data = response.json()
                
                # Validate the output
                test_result = validate_output(
                    case_name,
                    result_data,
                    EXPECTED_RESULTS[case_name]
                )
                
                test_result.print_result()
                results.append(test_result)
            else:
                test_result = TestResult(case_name)
                test_result.add_error(f"API returned status {response.status_code}: {response.text}")
                test_result.print_result()
                results.append(test_result)
        
        except requests.exceptions.ConnectionError:
            test_result = TestResult(case_name)
            test_result.add_error(f"Connection Error - Is the API running at {API_URL}?")
            test_result.print_result()
            results.append(test_result)
        
        except Exception as e:
            test_result = TestResult(case_name)
            test_result.add_error(f"Exception: {str(e)}")
            test_result.print_result()
            results.append(test_result)
    
    # Summary
    print("\n\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for r in results if r.status == "PASS")
    failed = sum(1 for r in results if r.status == "FAIL")
    
    print(f"\nTotal Tests: {len(results)}")
    print(f"✓ Passed: {passed}")
    print(f"✗ Failed: {failed}")
    print(f"Success Rate: {(passed/len(results))*100:.1f}%")
    
    if response_times:
        avg_time = sum(response_times.values()) / len(response_times)
        print(f"\nAverage Response Time: {avg_time*1000:.1f}ms")
        print(f"Min: {min(response_times.values())*1000:.1f}ms")
        print(f"Max: {max(response_times.values())*1000:.1f}ms")
    
    print("\n" + "="*80)
    print("DETAILED TEST RESULTS")
    print("="*80)
    
    for result in results:
        status_symbol = "✓" if result.status == "PASS" else "✗"
        print(f"\n{status_symbol} {result.case_name}: {result.status}")
        if result.data:
            print(f"   Prediction: {result.data.get('prediction')} | Risk: {result.data.get('risk_of_death')*100:.1f}%")
        if result.errors:
            for error in result.errors:
                print(f"   ✗ {error}")
        if result.warnings:
            for warning in result.warnings:
                print(f"   ⚠ {warning}")
    
    print("\n" + "="*80 + "\n")
    
    return passed == len(results)

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
