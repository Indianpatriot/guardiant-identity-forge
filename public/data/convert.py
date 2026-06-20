import pandas as pd
from pathlib import Path

data_dir = Path(".")

for csv_file in data_dir.glob("*.csv"):
    df = pd.read_csv(csv_file)

    json_file = csv_file.with_suffix(".json")

    df.to_json(
        json_file,
        orient="records",
        indent=2
    )

    print(f"Converted {csv_file.name} -> {json_file.name}")

print("Finished!")