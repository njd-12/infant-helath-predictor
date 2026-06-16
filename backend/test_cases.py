"""
Test cases for the Infant Mortality Predictor API
"""

# Test Case 1: Low Risk Profile
# Favorable conditions for infant health
low_risk_case = {
    "b0": 1,           # Single birth (better prognosis than multiple)
    "b4": 1,           # Female child
    "b11": 24,         # Adequate birth interval (24+ months)
    "m18": 2,          # Average/Large size at birth
    "m15": 1,          # Institutional delivery
    "v012": 28,        # Mother's age 25-35 (optimal range)
    "v025": 1,         # Urban residence (better healthcare access)
    "v136": 4,         # Moderate household size
    "m17": 1,          # Pregnancy wanted
    "v106": 2,         # Secondary education or higher
    "v190": 3,         # Higher wealth index
    "m14": 4,          # Multiple ANC visits
    "bord": 2,         # 2nd or 3rd birth (not first)
    "m19": 3200,       # Birth weight in grams
    "low_birth_weight": 0
}

# Test Case 2: High Risk Profile
# Adverse conditions for infant health
high_risk_case = {
    "b0": 2,           # Multiple birth (twins/triplets)
    "b4": 0,           # Male child (higher mortality rate)
    "b11": 6,          # Short birth interval
    "m18": 0,          # Small size at birth
    "m15": 0,          # Home/traditional delivery
    "v012": 18,        # Very young mother (< 20)
    "v025": 0,         # Rural residence (limited healthcare)
    "v136": 8,         # Large household size
    "m17": 0,          # Pregnancy not wanted
    "v106": 0,         # No education or primary only
    "v190": 0,         # Lowest wealth index
    "m14": 0,          # No ANC visits
    "bord": 1,         # First birth
    "m19": 2000,       # Low birth weight in grams
    "low_birth_weight": 1
}

# Test Case 3: Mixed Risk - Teenage Mother with Good Support
mixed_case_1 = {
    "b0": 1,           # Single birth
    "b4": 1,           # Female
    "b11": 0,          # First birth (no interval)
    "m18": 1,          # Normal size at birth
    "m15": 1,          # Institutional delivery
    "v012": 19,        # Young mother but not too young
    "v025": 1,         # Urban
    "v136": 4,         # Moderate household
    "m17": 0,          # Pregnancy not wanted (but has support)
    "v106": 1,         # Primary education
    "v190": 2,         # Medium wealth
    "m14": 2,          # Some ANC visits
    "bord": 1,         # First birth
    "m19": 2800,
    "low_birth_weight": 0
}

# Test Case 4: Older Mother, Multiparous (Multiple births)
mixed_case_2 = {
    "b0": 1,           # Single birth
    "b4": 0,           # Male
    "b11": 36,         # Long birth interval (healthy gap)
    "m18": 2,          # Good size at birth
    "m15": 1,          # Institutional delivery
    "v012": 35,        # Older mother (35+)
    "v025": 1,         # Urban
    "v136": 5,         # Moderate-large household
    "m17": 1,          # Pregnancy wanted
    "v106": 2,         # Secondary/higher education
    "v190": 2,         # Medium-high wealth
    "m14": 4,          # Good ANC visits
    "bord": 4,         # 4th birth
    "m19": 3500,
    "low_birth_weight": 0
}

# Test Case 5: Minimal Healthcare Access
high_risk_case_2 = {
    "b0": 1,           # Single birth
    "b4": 0,           # Male
    "b11": 12,         # Very short interval
    "m18": 0,          # Small size at birth
    "m15": 0,          # Home delivery
    "v012": 22,        # Young mother
    "v025": 0,         # Rural
    "v136": 9,         # Large household
    "m17": 0,          # Unwanted pregnancy
    "v106": 0,         # No/minimal education
    "v190": 0,         # Poorest
    "m14": 0,          # No antenatal care
    "bord": 1,         # First birth
    "m19": 1800,
    "low_birth_weight": 1
}

# Test Case 6: Well-Resourced, Healthy Profile
optimal_case = {
    "b0": 1,           # Single birth
    "b4": 1,           # Female (slightly better survival)
    "b11": 30,         # Good birth interval
    "m18": 2,          # Large size at birth
    "m15": 1,          # Institutional delivery
    "v012": 30,        # Optimal mother age
    "v025": 1,         # Urban
    "v136": 3,         # Small-moderate household
    "m17": 1,          # Wanted pregnancy
    "v106": 3,         # Higher education (assumed coding)
    "v190": 4,         # Highest wealth (if scale 0-4)
    "m14": 4,          # Full ANC visits
    "bord": 2,         # Not first birth
    "m19": 3300,
    "low_birth_weight": 0
}

# Test Cases Dictionary
test_cases = {
    "low_risk": low_risk_case,
    "high_risk": high_risk_case,
    "mixed_risk_teenage_mother": mixed_case_1,
    "mixed_risk_older_mother": mixed_case_2,
    "high_risk_minimal_care": high_risk_case_2,
    "optimal_conditions": optimal_case,
}

if __name__ == "__main__":
    import json
    print("Test Cases for Infant Mortality Predictor\n")
    print("=" * 60)
    
    for case_name, case_data in test_cases.items():
        print(f"\n{case_name.upper()}")
        print("-" * 60)
        print(json.dumps(case_data, indent=2))
