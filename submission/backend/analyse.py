import pandas as pd
import numpy as np

print("Initializing Identity Sprawl & Access Risk Analytics Engine...")

# 1. Load the generated datasets
employees = pd.read_csv("employees.csv")
mappings = pd.read_csv("identity_mapping.csv")
ad_accounts = pd.read_csv("active_directory_accounts.csv")
aws_accounts = pd.read_csv("aws_iam_accounts.csv")
okta_accounts = pd.read_csv("okta_accounts.csv")

# 2. Merge data frames to resolve identities across platforms
# Using employee_id as the master correlation keys
resolved_identities = employees.merge(mappings, on="employee_id", how="left")
resolved_identities = resolved_identities.merge(ad_accounts.drop(columns=['ad_username'], errors='ignore'), on="employee_id", how="left")
resolved_identities = resolved_identities.merge(aws_accounts.drop(columns=['aws_user'], errors='ignore'), on="employee_id", how="left")
resolved_identities = resolved_identities.merge(okta_accounts.drop(columns=['okta_login'], errors='ignore'), on="employee_id", how="left")

# Replace NaN values with appropriate fallbacks
resolved_identities['account_status_x'] = resolved_identities['account_status_x'].fillna('No Account') # AD
resolved_identities['account_status_y'] = resolved_identities['account_status_y'].fillna('No Account') # AWS
resolved_identities['account_status'] = resolved_identities['account_status'].fillna('No Account')     # Okta

# 3. Risk Scoring Framework Function
def calculate_identity_risk(row):
    score = 10  # Baseline score for any identity
    reasons = []
    
    # 🔴 ANOMALY A: Offboarding Gap / Orphaned Account (Highest Priority)
    if row['employment_status'] == 'Terminated':
        if row['account_status_y'] == 'Active' or row['account_status'] == 'Active':
            score += 80
            reasons.append("CRITICAL: Offboarding Gap - Terminated employee retains active Cloud/Okta sessions.")
            
    # 🟠 ANOMALY B: Over-Privileged Domain Admin Access
    if 'Domain Admins' in str(row['groups']) or 'AdministratorAccess' in str(row['policies']):
        score += 35
        reasons.append("HIGH: Cross-platform administrator privileges detected.")
        
    # 🟡 ANOMALY C: Dormancy Risk
    if pd.notna(row['last_activity_days']) and row['last_activity_days'] > 60:
        if row['account_status_y'] == 'Active':
            score += 15
            reasons.append("MEDIUM: Dormant cloud administrator presence detected.")
            
    # 🟡 ANOMALY D: MFA Compliance Gaps
    if str(row['mfa_enabled_x']) == 'False' or str(row['mfa_enabled_y']) == 'False':
        score += 20
        reasons.append("MEDIUM: Multi-factor authentication disabled on core interface.")

    # Bound check the risk score to a max ceiling of 100
    final_score = min(score, 100)
    
    # Classify overall tiering
    tier = "LOW"
    if final_score >= 80: tier = "CRITICAL"
    elif final_score >= 50: tier = "HIGH"
    elif final_score >= 25: tier = "MEDIUM"
        
    return pd.Series([final_score, tier, " | ".join(reasons) if reasons else "Profile Baseline Normal"])

# Apply the computational framework across all identities
resolved_identities[['risk_score', 'risk_tier', 'risk_analysis_narrative']] = resolved_identities.apply(calculate_identity_risk, axis=1)

# Save the final analytical ledger out to a clean dataset for your front-end
risk_ledger = resolved_identities[['employee_id', 'full_name', 'department', 'employment_status', 'risk_score', 'risk_tier', 'risk_analysis_narrative']]
risk_ledger.to_csv("identity_risk_ledger.csv", index=False)

print(f"SUCCESS: Cross-platform risk processing complete. Calculated scores for {len(risk_ledger)} identities.")
print("\n--- TOP 3 HIGHEST RISK THREATS IDENTIFIED ---")
print(risk_ledger.sort_values(by="risk_score", ascending=False).head(3).to_string(index=False))