import csv
import random
import uuid
from datetime import datetime, timedelta

# Set random seed for deterministic generation and consistent logic
random.seed(42)

print("Starting Enterprise Hybrid Identity Data Generation Engine...")

# ==========================================
# 1. CORE PARAMETERS & CONFIGURATION
# ==========================================
NUM_EMPLOYEES = 300
NUM_CONTRACTORS = 50
NUM_TERMINATED = 20
TOTAL_PEOPLE = NUM_EMPLOYEES + NUM_CONTRACTORS

DEPARMENTS = ["Engineering", "Security", "HR", "Finance", "DevOps", "Sales", "IT"]
DESIGNATIONS = {
    "Engineering": ["Software Engineer", "Senior Developer", "Engineering Manager", "Tech Lead"],
    "Security": ["Security Analyst", "IAM Engineer", "Security Architect", "CISO"],
    "HR": ["HR Associate", "HR Manager", "Talent Acquisition Specialist"],
    "Finance": ["Accountant", "Financial Analyst", "Finance Director"],
    "DevOps": ["DevOps Engineer", "Cloud Infrastructure Architect", "Site Reliability Engineer"],
    "Sales": ["Account Executive", "Sales Manager", "Business Development Representative"],
    "IT": ["Helpdesk Technician", "System Administrator", "Network Engineer"]
}

# ==========================================
# 2. GENERATE EMPLOYEES BASE (employees.csv)
# ==========================================
employees_data = []
active_emp_ids = []
terminated_emp_ids = []

first_names = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "James", "Robert", "Linda", "William", "Barbara", "Richard", "Mary", "Joseph", "Susan", "Thomas", "Margaret", "Charles", "Jessica", "Christopher"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]

# Distribute statuses across the pool
statuses = ["Active"] * (TOTAL_PEOPLE - NUM_TERMINATED) + ["Terminated"] * NUM_TERMINATED
random.shuffle(statuses)

for i in range(TOTAL_PEOPLE):
    emp_id = f"EMP_{1000 + i}"
    full_name = f"{random.choice(first_names)} {random.choice(last_names)}"
    dept = random.choice(DEPARMENTS)
    desig = random.choice(DESIGNATIONS[dept])
    mngr_id = f"EMP_{1000 + random.randint(0, i if i > 0 else 1)}"
    if mngr_id == emp_id: mngr_id = "EMP_1000"
    
    emp_type = "Contractor" if i >= NUM_EMPLOYEES else "Regular"
    status = statuses[i]
    
    # Dates logic
    join_days_ago = random.randint(100, 1000)
    joining_date = (datetime.now() - timedelta(days=join_days_ago)).strftime('%Y-%m-%d')
    
    if status == "Terminated":
        term_days_ago = random.randint(5, 60)
        termination_date = (datetime.now() - timedelta(days=term_days_ago)).strftime('%Y-%m-%d')
        terminated_emp_ids.append(emp_id)
    else:
        termination_date = ""
        active_emp_ids.append(emp_id)
        
    employees_data.append([emp_id, full_name, dept, desig, mngr_id, emp_type, status, joining_date, termination_date])

# ==========================================
# 3. IDENTITY MAPPING & ANOMALY DETERMINATION
# ==========================================
# Allocating specific percentages to meet constraints
# Mix: 12% Orphaned/Offboard Gap, 10% Over-privileged, 7% Escalation, 4% Token Abuse, 17% Legitimate High-Priv, 50% Normal
anomaly_map = {}
shuffled_all_ids = [e[0] for e in employees_data]
random.shuffle(shuffled_all_ids)

# Hardforce specific real-world anomalies onto terminated users first (Offboarding gaps)
for idx, term_id in enumerate(terminated_emp_ids):
    if idx < 12: # Significant chunk of terminated users keep stale cloud access
        anomaly_map[term_id] = "Offboarding Gap"
    else:
        anomaly_map[term_id] = "Normal Terminated"

# Allocate remaining anomalies to active accounts
remaining_actives = [i for i in shuffled_all_ids if i not in terminated_emp_ids]
num_actives = len(remaining_actives)

for i, emp_id in enumerate(remaining_actives):
    if emp_id in anomaly_map: continue
    if i < int(num_actives * 0.10):
        anomaly_map[emp_id] = "Over-privileged Identity"
    elif i < int(num_actives * 0.17):
        anomaly_map[emp_id] = "Privilege Escalation Case"
    elif i < int(num_actives * 0.21):
        anomaly_map[emp_id] = "Token/Credential Abuse"
    elif i < int(num_actives * 0.38):
        anomaly_map[emp_id] = "Legitimate High-Privilege User"
    else:
        anomaly_map[emp_id] = "Normal Active"

identity_mappings = []
ad_accounts = {}
aws_accounts = {}
okta_accounts = {}

for emp in employees_data:
    emp_id = emp[0]
    name_slug = emp[1].lower().replace(" ", "")
    anomaly = anomaly_map[emp_id]
    
    # Standard deterministic mappings
    ad_un = f"{name_slug[:6]}_{random.randint(10,99)}" if anomaly != "Token/Credential Abuse" else f"test-sa-{random.randint(100,999)}"
    aws_un = f"arn:aws:iam::112233445566:user/{name_slug}"
    ok_un = f"{name_slug}@enterprise.com"
    
    # Handle Lifecycle anomalies (Orphaned Accounts)
    if anomaly == "Normal Terminated":
        # Properly completely offboarded
        ad_un, aws_un, ok_un = "", "", ""
    elif anomaly == "Offboarding Gap":
        # AD is disabled, but Cloud IAM and Okta environments are accidentally left active!
        ad_un = f"{name_slug[:6]}_ad"
        
    ad_accounts[emp_id] = ad_un
    aws_accounts[emp_id] = aws_un
    okta_accounts[emp_id] = ok_un
    
    identity_mappings.append([emp_id, ad_un, aws_un, ok_un])

# ==========================================
# 4. PLATFORM ACCOUNTS GENERATION
# ==========================================
ad_data = []
aws_data = []
okta_data = []

for emp in employees_data:
    emp_id = emp[0]
    dept = emp[2]
    status = emp[6]
    anomaly = anomaly_map[emp_id]
    
    ad_un = ad_accounts[emp_id]
    aws_un = aws_accounts[emp_id]
    ok_un = okta_accounts[emp_id]
    
    # --- ACTIVE DIRECTORY ---
    if ad_un:
        ad_status = "Disabled" if status == "Terminated" else "Enabled"
        last_log = random.randint(0, 10) if status == "Active" else random.randint(30, 90)
        mfa = "True" if random.random() > 0.1 else "False"
        
        groups = [f"Domain Users", f"Dept-{dept}"]
        if anomaly == "Over-privileged Identity" or dept in ["DevOps", "IT"]:
            groups.append("Domain Admins")
        if anomaly == "Privilege Escalation Case":
            groups.append("DevTeam") # Links to the nested group mapping later
            
        ad_data.append([emp_id, ad_un, ad_status, last_log, mfa, ";".join(groups)])
        
    # --- AWS IAM ---
    if aws_un:
        aws_status = "Active" # Left active even for Offboarding Gaps!
        last_act = random.randint(0, 14) if status == "Active" else random.randint(45, 120)
        
        roles = [f"Role-{dept}"]
        policies = ["ReadOnlyAccess"]
        
        if anomaly in ["Over-privileged Identity", "Offboarding Gap"] or dept in ["DevOps", "Engineering"]:
            policies.append("AdministratorAccess")
            policies.append("S3FullAccess")
        if anomaly == "Legitimate High-Privilege User":
            policies.append("PowerUserAccess")
            
        aws_data.append([emp_id, aws_un, aws_status, ";".join(roles), ";".join(policies), last_act])
        
    # --- OKTA ---
    if ok_un:
        ok_status = "Active"
        mfa_okta = "False" if anomaly == "Token/Credential Abuse" else "True"
        apps = ["Slack", "GoogleWorkspace", "Zoom"]
        
        if dept in ["DevOps", "Engineering"]: apps.extend(["AWS_SSO", "GitHub"])
        if dept == "Finance": apps.append("NetSuite")
        if dept == "Sales": apps.append("Salesforce")
        
        okta_data.append([emp_id, ok_un, ok_status, mfa_okta, ";".join(apps)])

# ==========================================
# 5. NESTED GROUP INHERITANCE (group_inheritance.csv)
# ==========================================
group_inheritance = [
    ["DevTeam", "CloudDeployers"],
    ["CloudDeployers", "AWSAdmins"],
    ["AWSAdmins", "ProductionAccess"],
    ["Domain Admins", "Enterprise Admins"],
    ["IT-Support", "LocalAdmins"]
]
# Generate filler structural relationships to reach 100+ items
for k in range(100):
    group_inheritance.append([f"SubGroup-Tier{k}", f"ParentGroup-Tier{k+1}"])

# ==========================================
# 6. PRIVILEGE ASSIGNMENTS (privilege_assignments.csv)
# ==========================================
priv_assignments = []
for ad in ad_data:
    priv_assignments.append([ad[1], "AD-Login", "ActiveDirectory", "Direct"])
    if "Domain Admins" in ad[5]:
        priv_assignments.append([ad[1], "Write-Schema", "ActiveDirectory", "Inherited"])
for aws in aws_data:
    if "AdministratorAccess" in aws[4]:
        priv_assignments.append([aws[1], "*", "AWS", "Direct"])

# ==========================================
# 7. SERVICE ACCOUNTS POOL (service_accounts.csv)
# ==========================================
sa_data = [
    ["svc-etl-prod", "EMP_1002", "CRITICAL", "180", "ActiveDirectory;AWS"],
    ["svc-jenkins-cicd", "EMP_1045", "HIGH", "45", "AWS;Okta"],
    ["svc-backups-s3", "Orphaned", "CRITICAL", "450", "AWS"], # Orphaned SA risk
    ["svc-scanner-vuln", "EMP_1088", "HIGH", "12", "ActiveDirectory"]
]

# ==========================================
# 8. INCIDENTS & ANALYTICS DATASETS (incidents.csv)
# ==========================================
incidents_data = []
severity_options = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

inc_counter = 1
for emp_id, anomaly in anomaly_map.items():
    if "Normal" in anomaly or inc_counter > 50: continue
    
    sev = "CRITICAL" if anomaly in ["Offboarding Gap", "Privilege Escalation Case"] else "HIGH"
    desc = f"Identity metadata deviation observed. Pattern aligned with profile fingerprint: {anomaly}."
    
    incidents_data.append([f"INC_{2000 + inc_counter}", emp_id, sev, anomaly, desc])
    inc_counter += 1

# Pad out up to 50 incidents
while len(incidents_data) < 50:
    incidents_data.append([f"INC_{2000 + len(incidents_data)}", "EMP_1010", "LOW", "Dormant Admin", "Admin identity untouched for over 90 days across cross-platform profiles."])

# ==========================================
# 9. COMPREHENSIVE AUDIT TRAIL LOGS (audit_events.csv)
# ==========================================
audit_events = []
base_time = datetime.now() - timedelta(days=5)

event_types = ["LoginSuccess", "LoginFailed", "PrivilegeEscalation", "GroupAddition", "TokenCreation", "TokenUsage"]
platforms = ["ActiveDirectory", "AWS", "Okta", "Salesforce"]

for step in range(2000):
    timestamp = (base_time + timedelta(minutes=step * 3)).strftime('%Y-%m-%d %H:%M:%S')
    emp_choice = random.choice(employees_data)
    emp_id = emp_choice[0]
    anomaly = anomaly_map[emp_id]
    
    platform = random.choice(platforms)
    res = "Success" if random.random() > 0.05 else "Failed"
    ip = f"10.21.14.{random.randint(2, 254)}"
    
    # Inject deterministic threat telltales inside the logs for teams to find via analysis
    if anomaly == "Offboarding Gap" and step % 40 == 0:
        platform = "AWS"
        ev_type = "TokenUsage"
        ip = "198.51.100.42" # Rogue public IP accessing terminated asset context
    elif anomaly == "Privilege Escalation Case" and step % 50 == 0:
        platform = "ActiveDirectory"
        ev_type = "GroupAddition"
    else:
        ev_type = random.choice(event_types)
        
    audit_events.append([timestamp, emp_id, platform, ev_type, ip, res])

# ==========================================
# 10. WRITING EVERYTHING TO VALID CSV METADATA
# ==========================================
files_to_write = {
    "employees.csv": (["employee_id", "full_name", "department", "designation", "manager_id", "employment_type", "employment_status", "joining_date", "termination_date"], employees_data),
    "identity_mapping.csv": (["employee_id", "ad_account", "aws_account", "okta_account"], identity_mappings),
    "active_directory_accounts.csv": (["employee_id", "ad_username", "account_status", "last_login_days", "mfa_enabled", "groups"], ad_data),
    "aws_iam_accounts.csv": (["employee_id", "aws_user", "account_status", "roles", "policies", "last_activity_days"], aws_data),
    "okta_accounts.csv": (["employee_id", "okta_login", "account_status", "mfa_enabled", "assigned_apps"], okta_data),
    "group_inheritance.csv": (["parent_group", "child_group"], group_inheritance),
    "privilege_assignments.csv": (["identity", "privilege", "platform", "access_level"], priv_assignments),
    "service_accounts.csv": (["service_account_name", "owner", "privilege_level", "last_rotation_days", "platforms"], sa_data),
    "incidents.csv": (["incident_id", "employee_id", "severity", "incident_type", "description"], incidents_data)
}

for filename, (headers, data_rows) in files_to_write.items():
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(data_rows)

print("SUCCESS: 9 Core relational CSV identity datasets successfully structured and emitted locally.")