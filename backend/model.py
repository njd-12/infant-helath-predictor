import os
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
import numpy as np
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score
)
from lightgbm import LGBMClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV
import optuna
data = pd.read_stata('./IAKR7EFL.DTA',convert_categoricals=False)
sm = SMOTE()
print(data.head())
data["b5"] = data["b5"].replace({'yes':1,'no':0})

data["b7"] = pd.to_numeric(data["b7"],errors='coerce')

data['infant_mortatily'] = ((data["b5"]==0)&(data["b7"]<12)).astype(int)



print(data["v024"].value_counts())
cols = [  
    "b0",    # Multiple birth
    "b4",    # Child sex
    "b11",   # Birth interval
    "m18",   # Birth size
    "m15",   # Place of delivery
    "v012",  # Mother's age
    "v025",  # Residence
    "v136",  # Household size
    "m17",   # Birth weight
    "v106",  # Mother's education
    "v190",  # Wealth index
    "m14",   # ANC visits
    "bord"   # Birth order
    ]

print(data[cols].head())
print(data["v008"].value_counts())

df_model = data[cols + ["infant_mortatily"]].copy()

print(df_model.head())

df_model["b11"].fillna(df_model['b11'].median(),inplace=True)

categorical_cols = ['b0', 'b4', 'm18', 'm15', 'v025', 'm17']
df_model = pd.get_dummies(df_model, columns=categorical_cols, drop_first=False )
numeric_cols = ['b11', 'v012', 'v136', 'infant_mortatily','v106','v190','bord']
df_model[numeric_cols] = df_model[numeric_cols].apply(pd.to_numeric, errors='coerce')

bool_cols = df_model.select_dtypes('bool').columns
df_model[bool_cols] = df_model[bool_cols].astype(int)

X = df_model.drop('infant_mortatily',axis=1)
Y = df_model["infant_mortatily"]
def xbg_objective(trial):
    params={
        "max_depth": trial.suggest_int("max_depth", 3, 12),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
        "n_estimators": trial.suggest_int("n_estimators", 100, 600),
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "gamma": trial.suggest_float("gamma", 0, 5),
        "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
        "scale_pos_weight": trial.suggest_float("scale_pos_weight", 8, 15),
        "eval_metric": "logloss",
        "tree_method": "hist"
    }
    x_train,x_test,y_train,y_test = train_test_split(X,Y,random_state=42,test_size=0.2,stratify=Y)
    model = XGBClassifier(
        **params,
    )
    model.fit(x_train,y_train)
    y_pred_proba = model.predict_proba(x_test)[:,1]

    threshold = 0.45
    y_pred = (y_pred_proba>=threshold).astype(int)
    return f1_score(y_test,y_pred)

study  = optuna.create_study(
    direction="maximize",
    study_name="xbg_infant"
)
study.optimize(xbg_objective,n_trials=35)

print("Best F1 Score:", study.best_value)
print("Best Hyperparameters:", study.best_params)



best_params = study.best_params
X_train, X_test, y_train, y_test = train_test_split(
    X, Y, test_size=0.2, stratify=Y, random_state=42
)
final_model = XGBClassifier(
    **best_params,
    eval_metric="logloss",
    tree_method="hist",
    random_state=42
)
print("m18 unique:", sorted(data["m18"].dropna().unique()))
print("m15 unique:", sorted(data["m15"].dropna().unique()))
print("v025 unique:", sorted(data["v025"].dropna().unique()))
print("m17 unique:", sorted(data["m17"].dropna().unique()))
print("b4 unique:", sorted(data["b4"].dropna().unique()))

final_model.fit(X_train, y_train)
y_prob = final_model.predict_proba(X_test)[:, 1]
best_threshold = 0.5
best_f1 = 0

for t in np.arange(0.1, 0.9, 0.05):
    y_pred = (y_prob >= t).astype(int)

    f1 = f1_score(y_test, y_pred)

    if f1 > best_f1:
        best_f1 = f1
        best_threshold = t

print("Best Threshold:", best_threshold)
print("Best F1:", best_f1)
y_pred = (y_prob>=best_threshold).astype(int)
f1 = f1_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)
import joblib

joblib.dump(final_model, "infant_mortality_model.pkl")
joblib.dump(X.columns.tolist(), "model_features.pkl")

print("F1 Score:", round(f1, 3))
print("Precision:", round(precision, 3))
print("Recall:", round(recall, 3))
print("ROC-AUC:", round(roc_auc, 3))

print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:\n", cm)

import seaborn as sns
import matplotlib.pyplot as plt

plt.figure(figsize=(5,4))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=["Survived", "Died"],
    yticklabels=["Survived", "Died"]
)

plt.xlabel("Predicted Label")
plt.ylabel("Actual Label")
plt.title("Confusion Matrix – Infant Mortality Prediction")
plt.tight_layout()
plt.show()


from sklearn.metrics import roc_curve, roc_auc_score
import matplotlib.pyplot as plt


# Compute ROC curve
fpr, tpr, thresholds = roc_curve(y_test, y_prob)

# Compute AUC
roc_auc = roc_auc_score(y_test, y_prob)

# Plot ROC curve
plt.figure(figsize=(6, 5))
plt.plot(fpr, tpr, label=f'XGBoost (AUC = {roc_auc:.3f})')


plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve for Infant Mortality Prediction')
plt.legend(loc='lower right')
plt.grid(True)
plt.show()
