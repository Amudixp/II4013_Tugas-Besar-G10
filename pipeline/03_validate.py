import pandas as pd

df = pd.read_csv("data/integrated/integrated_data_stunting.csv")

print("\n[DATA VALIDATION]\n")

print(f"Total baris        : {len(df)}")
print(f"Total kolom        : {len(df.columns)}")

print(f"Jumlah kecamatan   : {df['kecamatan'].nunique()}")
print(f"Jumlah kelurahan   : {df['kelurahan'].nunique()}")
print(f"Jumlah puskesmas   : {df['puskesmas'].nunique()}")

print(f"Rentang tahun      : {df['tahun'].min()} - {df['tahun'].max()}")

print(f"Bulan unik         : {df['bulan'].nunique()}")
print(f"Daftar bulan       : {sorted(df['bulan'].dropna().unique())}")

print(f"Duplikasi baris    : {df.duplicated().sum()}")

print("\n[MISSING VALUE]\n")

missing = df.isnull().sum()
missing = missing[missing > 0].sort_values(ascending=False)

if len(missing) == 0:
    print("No missing value")
else:
    print(missing)

print("\n[TIPE DATA]\n")
print(df.dtypes)

print("\n[DATA SAMPLE]\n")
print(df.head())