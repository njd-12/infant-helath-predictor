import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.calibration import CalibratedClassifierCV
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
import optuna
import joblib
import seaborn as sns
import matplotlib.pyplot as plt

optuna.logging.set_verbosity(optuna.logging.WARNING)

# ─────────────────────────────────────────────
# 1. LOAD DATA
# ─────────────────────────────────────────────
data = pd.read_stata('./IAKR7EFL.DTA', convert_categoricals=False)

data["b5"] = pd.to_numeric(data["b5"], errors='coerce')
data["b7"] = pd.to_numeric(data["b7"], errors='coerce')
print(data["m18"].value_counts().sort_index())
# Infant mortality: child died before 12 months
data['infant_mortality'] = ((data["b5"] == 0) & (data["b7"] < 12)).astype(int)

# ── Clean m19 (actual birth weight in grams) ──────────────────────────
# DHS sentinel codes 9996/9997/9998 = "don't know / missing" — null them out
data["m19"] = pd.to_numeric(data["m19"], errors='coerce')
data["m19"] = data["m19"].replace({9996: np.nan, 9997: np.nan, 9998: np.nan})

# Derived clinical feature: low birth weight (< 2500 g) — strong mortality predictor
data["low_birth_weight"] = (data["m19"] < 2500).astype('Int8')  # NaN-safe

print(f"Infant mortality cases : {data['infant_mortality'].sum()}")
print(f"Total records          : {len(data)}")
print(f"Mortality rate         : {data['infant_mortality'].mean()*100:.2f}%")
print(f"Low birth weight cases : {data['low_birth_weight'].sum()}\n")

# ─────────────────────────────────────────────
# 2. FEATURE SELECTION
# ─────────────────────────────────────────────
cols = [
    "b0",              # Multiple birth
    "b4",              # Child sex
    "b11",             # Birth interval
    "m18",             # Perceived birth size
    "m15",             # Place of delivery
    "v012",            # Mother's age
    "v025",            # Residence (urban/rural)
    "v136",            # Household size
    "m17",             # Birth weight category
    "v106",            # Mother's education
    "v190",            # Wealth index
    "m14",             # ANC visits
    "bord",            # Birth order
    "m19",             # Actual birth weight (grams)  ← NEW
    "low_birth_weight" # Derived: LBW flag            ← NEW
]

df_model = data[cols + ["infant_mortality"]].copy()

# ─────────────────────────────────────────────
# 3. PREPROCESSING
# ─────────────────────────────────────────────
categorical_cols = ['b0', 'b4', 'm18', 'm15', 'v025', 'm17']
numeric_cols     = ['b11', 'v012', 'v136', 'v106', 'v190', 'm14', 'bord',
                    'm19', 'low_birth_weight']

df_model = pd.get_dummies(df_model, columns=categorical_cols, drop_first=False)
df_model[numeric_cols] = df_model[numeric_cols].apply(pd.to_numeric, errors='coerce')

bool_cols = df_model.select_dtypes('bool').columns
df_model[bool_cols] = df_model[bool_cols].astype(int)

X = df_model.drop('infant_mortality', axis=1)
Y = df_model["infant_mortality"]

# ─────────────────────────────────────────────
# 4. THREE-WAY SPLIT  (train / val / test)
#    Val used for threshold search — test never touched until final eval
# ─────────────────────────────────────────────
X_temp, X_test, y_temp, y_test = train_test_split(
    X, Y, test_size=0.15, stratify=Y, random_state=42
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.15, stratify=y_temp, random_state=42
)

print(f"Train : {len(X_train)}  |  Val : {len(X_val)}  |  Test : {len(X_test)}\n")

# ─────────────────────────────────────────────
# 5. IMPUTATION  (fit on train only — no leakage)
# ─────────────────────────────────────────────
imputer = SimpleImputer(strategy='median')
X_train_imp = pd.DataFrame(imputer.fit_transform(X_train), columns=X_train.columns)
X_val_imp   = pd.DataFrame(imputer.transform(X_val),       columns=X_val.columns)
X_test_imp  = pd.DataFrame(imputer.transform(X_test),      columns=X_test.columns)

# ─────────────────────────────────────────────
# 6. MODERATE SMOTE
#    28:1 natural ratio → target ~5:1 (minority = 20% of majority)
# ─────────────────────────────────────────────
natural_ratio = (y_train == 1).sum() / (y_train == 0).sum()
smote_ratio   = min(0.20, natural_ratio * 3)

sm = SMOTE(random_state=42, sampling_strategy=smote_ratio)
X_train_sm, y_train_sm = sm.fit_resample(X_train_imp, y_train)

print("Class distribution after moderate SMOTE:")
print(f"  Survival : {(y_train_sm==0).sum()}")
print(f"  Mortality: {(y_train_sm==1).sum()}")
print(f"  Ratio    : {(y_train_sm==0).sum()/(y_train_sm==1).sum():.1f}:1\n")

# ─────────────────────────────────────────────
# 7. OPTUNA HYPERPARAMETER SEARCH
#    Evaluated on val set — no test leakage
# ─────────────────────────────────────────────
IMBALANCE_RATIO = (y_train_sm == 0).sum() / (y_train_sm == 1).sum()

def xgb_objective(trial):
    params = {
        "max_depth":        trial.suggest_int("max_depth", 3, 10),
        "learning_rate":    trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
        "n_estimators":     trial.suggest_int("n_estimators", 200, 800),
        "subsample":        trial.suggest_float("subsample", 0.5, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "gamma":            trial.suggest_float("gamma", 0, 5),
        "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
        "reg_alpha":        trial.suggest_float("reg_alpha", 1e-4, 10.0, log=True),
        "reg_lambda":       trial.suggest_float("reg_lambda", 1e-4, 10.0, log=True),
        "scale_pos_weight": trial.suggest_float("scale_pos_weight", 1.0, IMBALANCE_RATIO),
        "eval_metric":      "logloss",
        "tree_method":      "hist",
        "random_state":     42,
    }
    model = XGBClassifier(**params)
    model.fit(X_train_sm, y_train_sm)
    y_prob_val = model.predict_proba(X_val_imp)[:, 1]

    best_f1_inner = 0.0
    for t in np.arange(0.1, 0.9, 0.05):
        f1 = f1_score(y_val, (y_prob_val >= t).astype(int), zero_division=0)
        if f1 > best_f1_inner:
            best_f1_inner = f1
    return best_f1_inner

study = optuna.create_study(direction="maximize", study_name="xgb_infant_v3")
study.optimize(xgb_objective, n_trials=50, show_progress_bar=True)

print(f"\nBest Val F1 : {study.best_value:.4f}")
print(f"Best Params : {study.best_params}\n")

# ─────────────────────────────────────────────
# 8. FINAL MODEL TRAINING
# ─────────────────────────────────────────────
final_params = study.best_params.copy()
final_params.update({"eval_metric": "logloss", "tree_method": "hist", "random_state": 42})

final_model = XGBClassifier(**final_params)
final_model.fit(X_train_sm, y_train_sm)

# ─────────────────────────────────────────────
# 9. PROBABILITY CALIBRATION
#    Fit on real (non-synthetic) data — train + val combined
# ─────────────────────────────────────────────
print("Calibrating probabilities on real data …")
X_real_cal = pd.concat([X_train_imp, X_val_imp], ignore_index=True)
y_real_cal  = pd.concat([y_train,     y_val],     ignore_index=True)

calibrator = CalibratedClassifierCV(final_model, method='isotonic', cv=5)
calibrator.fit(X_real_cal, y_real_cal)

y_prob_test_raw = final_model.predict_proba(X_test_imp)[:, 1]
y_prob_test_cal = calibrator.predict_proba(X_test_imp)[:, 1]

print(f"Raw prob — mean: {y_prob_test_raw.mean():.4f}  std: {y_prob_test_raw.std():.4f}")
print(f"Cal prob — mean: {y_prob_test_cal.mean():.4f}  std: {y_prob_test_cal.std():.4f}\n")

# ─────────────────────────────────────────────
# 10. THRESHOLD SELECTION ON VALIDATION SET
# ─────────────────────────────────────────────
y_prob_val_cal = calibrator.predict_proba(X_val_imp)[:, 1]

# Step A — F1-optimal threshold
best_threshold, best_f1_val = 0.5, 0.0
for t in np.arange(0.05, 0.90, 0.01):
    f1 = f1_score(y_val, (y_prob_val_cal >= t).astype(int), zero_division=0)
    if f1 > best_f1_val:
        best_f1_val   = f1
        best_threshold = t

print(f"F1-optimal threshold (val) : {best_threshold:.2f}  →  F1 = {best_f1_val:.4f}")

# Step B — Recall-targeted override (catches at least 50% of deaths)
TARGET_RECALL = 0.50
print(f"\nSearching for threshold with recall >= {TARGET_RECALL} on val set …")
recall_threshold = None
for t in np.arange(0.05, 0.50, 0.01):
    r = recall_score(y_val, (y_prob_val_cal >= t).astype(int), zero_division=0)
    p = precision_score(y_val, (y_prob_val_cal >= t).astype(int), zero_division=0)
    if r >= TARGET_RECALL:
        recall_threshold = t
        print(f"  → Threshold: {t:.2f}  |  Recall: {r:.3f}  |  Precision: {p:.3f}")
        break

if recall_threshold is None:
    print("  Could not reach target recall — keeping F1-optimal threshold.")
else:
    best_threshold = recall_threshold
    print(f"  Overriding to recall-targeted threshold: {best_threshold:.2f}")

print()

# ─────────────────────────────────────────────
# 11. FINAL EVALUATION ON HELD-OUT TEST SET
# ─────────────────────────────────────────────
y_pred    = (y_prob_test_cal >= best_threshold).astype(int)
f1        = f1_score(y_test, y_pred, zero_division=0)
precision = precision_score(y_test, y_pred, zero_division=0)
recall    = recall_score(y_test, y_pred, zero_division=0)
roc_auc   = roc_auc_score(y_test, y_prob_test_cal)

print("=" * 45)
print("TEST SET RESULTS")
print("=" * 45)
print(f"F1 Score  : {f1:.3f}")
print(f"Precision : {precision:.3f}")
print(f"Recall    : {recall:.3f}")
print(f"ROC-AUC   : {roc_auc:.3f}")
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred, target_names=["Survived", "Died"]))

# ─────────────────────────────────────────────
# 12. PLOTS
# ─────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(13, 5))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(
    cm, annot=True, fmt="d", cmap="Blues", ax=axes[0],
    xticklabels=["Survived", "Died"],
    yticklabels=["Survived", "Died"]
)
axes[0].set_xlabel("Predicted Label")
axes[0].set_ylabel("Actual Label")
axes[0].set_title("Confusion Matrix – Infant Mortality")

# ROC curve
fpr, tpr, _ = roc_curve(y_test, y_prob_test_cal)
axes[1].plot(fpr, tpr, label=f'XGBoost calibrated (AUC = {roc_auc:.3f})', lw=2)
axes[1].plot([0, 1], [0, 1], 'k--', lw=1)
axes[1].set_xlabel('False Positive Rate')
axes[1].set_ylabel('True Positive Rate')
axes[1].set_title('ROC Curve – Infant Mortality')
axes[1].legend(loc='lower right')
axes[1].grid(True)

plt.tight_layout()
plt.savefig("infant_mortality_results.png", dpi=150)
plt.show()

# Feature importance
feat_imp = pd.Series(
    final_model.feature_importances_, index=X_train_sm.columns
).sort_values(ascending=False).head(20)

plt.figure(figsize=(8, 6))
feat_imp.plot(kind='barh')
plt.gca().invert_yaxis()
plt.title("Top 20 Feature Importances (XGBoost)")
plt.xlabel("Gain")
plt.tight_layout()
plt.savefig("feature_importance.png", dpi=150)
plt.show()

# ─────────────────────────────────────────────
# 13. SAVE ARTEFACTS
# ─────────────────────────────────────────────
joblib.dump(final_model,        "infant_mortality_model.pkl")
joblib.dump(calibrator,         "probability_calibrator.pkl")
joblib.dump(imputer,            "imputer.pkl")
joblib.dump(best_threshold,     "optimal_threshold.pkl")
joblib.dump(X.columns.tolist(), "model_features.pkl")

print("\nAll artefacts saved.")