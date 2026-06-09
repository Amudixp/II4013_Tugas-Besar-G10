import pandas as pd
import os

files = {
    "2022": "data/raw/622373002-TEPRA-STUNTING-THN-2022.xlsx",
}

dataframes = {}
for bulan, path in files.items():
    df = pd.read_excel(path)
    df["bulan"] = bulan 
    dataframes[bulan] = df