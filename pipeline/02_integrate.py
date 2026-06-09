import pandas as pd
import numpy as np
import os

RAW_FILE = "data/raw/622373002-TEPRA-STUNTING-THN-2022.xlsx"
OUTPUT_FILE = "data/integrated/stunting_2022_long.csv"

IDENTITAS_COLS = {
    "no":         0,
    "kecamatan":  1,
    "id_kec":     2,
    "puskesmas":  3,
    "kelurahan":  4,
    "jml_posyandu": 5,
    "balita_ada": 6,
}

BULAN_JAN_MEI = {
    "Januari":  {"total_stunting": 7,  "u0_6": 8,  "u6_11": 9,  "u12_23": 10, "u24_59": 11, "kasus_baru": 12, "lulus": 13, "kasus_lama": 14},
    "Februari": {"total_stunting": 15, "u0_6": 16, "u6_11": 17, "u12_23": 18, "u24_59": 19, "kasus_baru": 20, "lulus": 21, "kasus_lama": 22},
    "Maret":    {"total_stunting": 23, "u0_6": 24, "u6_11": 25, "u12_23": 26, "u24_59": 27, "kasus_baru": 28, "lulus": 29, "kasus_lama": 30},
    "April":    {"total_stunting": 31, "u0_6": 32, "u6_11": 33, "u12_23": 34, "u24_59": 35, "kasus_baru": 36, "lulus": 37, "kasus_lama": 38},
    "Mei":      {"total_stunting": 39, "u0_6": 40, "u6_11": 41, "u12_23": 42, "u24_59": 43, "kasus_baru": 44, "lulus": 45, "kasus_lama": 46},
}

BULAN_JUN_DES = {
    "Juni": {
        "total_balita": 47, "total_stunting": 48,
        "lama_0_6": 49,  "lama_6_11": 50,  "lama_12_23": 51,  "lama_24_59": 52,
        "baru_0_6": 53,  "baru_6_11": 54,  "baru_12_23": 55,  "baru_24_59": 56,
        "lulus_membaik_0_6": 57, "lulus_membaik_6_11": 58, "lulus_membaik_12_23": 59, "lulus_membaik_24_59": 60,
        "lulus_pindah_0_6": 61, "lulus_pindah_6_11": 62, "lulus_pindah_12_23": 63, "lulus_pindah_24_59": 64,
        "lulus_umur_gt59": 65, "meninggal": 66, "total_lulus": 67,
    },
    "Juli": {
        "total_balita": 68, "total_stunting": 69,
        "lama_0_6": 70,  "lama_6_11": 71,  "lama_12_23": 72,  "lama_24_59": 73,
        "baru_0_6": 74,  "baru_6_11": 75,  "baru_12_23": 76,  "baru_24_59": 77,
        "lulus_membaik_0_6": 78, "lulus_membaik_6_11": 79, "lulus_membaik_12_23": 80, "lulus_membaik_24_59": 81,
        "lulus_pindah_0_6": 82, "lulus_pindah_6_11": 83, "lulus_pindah_12_23": 84, "lulus_pindah_24_59": 85,
        "lulus_umur_gt59": 86, "meninggal": 87, "total_lulus": 88,
    },
    "Agustus": {
        "total_balita": 89, "total_stunting": 91,
        "lama_0_6": 92,  "lama_6_11": 93,  "lama_12_23": 94,  "lama_24_59": 95,
        "baru_0_6": 96,  "baru_6_11": 97,  "baru_12_23": 98,  "baru_24_59": 99,
        "lulus_membaik_0_6": 100, "lulus_membaik_6_11": 101, "lulus_membaik_12_23": 102, "lulus_membaik_24_59": 103,
        "lulus_pindah_0_6": 104, "lulus_pindah_6_11": 105, "lulus_pindah_12_23": 106, "lulus_pindah_24_59": 107,
        "lulus_umur_gt59": 108, "meninggal": 109, "total_lulus": 110,
    },
    "September": {
        "total_balita": 111, "total_stunting": 115,
        "lama_0_6": 118, "lama_6_11": 119, "lama_12_23": 120, "lama_24_59": 121,
        "baru_0_6": 122, "baru_6_11": 123, "baru_12_23": 124, "baru_24_59": 125,
        "lulus_membaik_0_6": 126, "lulus_membaik_6_11": 127, "lulus_membaik_12_23": 128, "lulus_membaik_24_59": 129,
        "lulus_pindah_0_6": 130, "lulus_pindah_6_11": 131, "lulus_pindah_12_23": 132, "lulus_pindah_24_59": 133,
        "lulus_umur_gt59": 134, "meninggal": 135,
    },
    "Oktober": {
        "total_balita": 138, "total_stunting": 142,
        "lama_0_6": 145, "lama_6_11": 146, "lama_12_23": 147, "lama_24_59": 148,
        "baru_0_6": 149, "baru_6_11": 150, "baru_12_23": 151, "baru_24_59": 152,
        "lulus_membaik_0_6": 153, "lulus_membaik_6_11": 154, "lulus_membaik_12_23": 155, "lulus_membaik_24_59": 156,
        "lulus_pindah_0_6": 157, "lulus_pindah_6_11": 158, "lulus_pindah_12_23": 159, "lulus_pindah_24_59": 160,
        "lulus_umur_gt59": 161, "meninggal": 162,
    },
    "November": {
        "total_balita": 165, "total_stunting": 171,
        "lama_0_6": 174, "lama_6_11": 175, "lama_12_23": 176, "lama_24_59": 177,
        "baru_0_6": 178, "baru_6_11": 179, "baru_12_23": 180, "baru_24_59": 181,
        "lulus_membaik_0_6": 182, "lulus_membaik_6_11": 183, "lulus_membaik_12_23": 184, "lulus_membaik_24_59": 185,
        "lulus_pindah_0_6": 186, "lulus_pindah_6_11": 187, "lulus_pindah_12_23": 188, "lulus_pindah_24_59": 189,
    },
    "Desember": {
        "total_balita": 194, "total_stunting": 201,
        "lama_0_6": 204, "lama_6_11": 205, "lama_12_23": 206, "lama_24_59": 207,
        "baru_0_6": 208, "baru_6_11": 209, "baru_12_23": 210, "baru_24_59": 211,
        "lulus_membaik_0_6": 212, "lulus_membaik_6_11": 213, "lulus_membaik_12_23": 214, "lulus_membaik_24_59": 215,
        "lulus_pindah_0_6": 216, "lulus_pindah_6_11": 217, "lulus_pindah_12_23": 218,
    },
}

df_raw = pd.read_excel(RAW_FILE, sheet_name=0, header=None)

data_rows = df_raw.iloc[6:].reset_index(drop=True)

data_rows = data_rows[data_rows.iloc[:, 1].notna()].reset_index(drop=True)
print(f"Baris data valid: {len(data_rows)}")

identitas = pd.DataFrame()
for col_name, col_idx in IDENTITAS_COLS.items():
    identitas[col_name] = data_rows.iloc[:, col_idx]

def extract_bulan(data_rows, identitas, bulan_nama, col_map, is_detail=False):
    rows = []
    for i in range(len(data_rows)):
        row = identitas.iloc[i].to_dict()
        row["bulan"] = bulan_nama
        row["tahun"] = 2022

        for field, col_idx in col_map.items():
            if col_idx < data_rows.shape[1]:
                val = data_rows.iloc[i, col_idx]
                row[field] = val if pd.notna(val) else np.nan
            else:
                row[field] = np.nan

        if not is_detail:
            row["total_balita"] = np.nan

        rows.append(row)
    return pd.DataFrame(rows)

semua_bulan = []

print("Memproses bulan Jan-Mei (format sederhana)...")
for bulan, col_map in BULAN_JAN_MEI.items():
    df_bulan = extract_bulan(data_rows, identitas, bulan, col_map, is_detail=False)
    df_bulan["lama_0_6"] = np.nan
    df_bulan["lama_6_11"] = np.nan
    df_bulan["lama_12_23"] = np.nan
    df_bulan["lama_24_59"] = np.nan
    df_bulan["baru_0_6"] = np.nan
    df_bulan["baru_6_11"] = np.nan
    df_bulan["baru_12_23"] = np.nan
    df_bulan["baru_24_59"] = np.nan
    df_bulan["lulus_membaik_0_6"] = np.nan
    df_bulan["lulus_membaik_6_11"] = np.nan
    df_bulan["lulus_membaik_12_23"] = np.nan
    df_bulan["lulus_membaik_24_59"] = np.nan
    df_bulan["meninggal"] = np.nan
    semua_bulan.append(df_bulan)

print("Memproses bulan Jun-Des (format detail)...")
for bulan, col_map in BULAN_JUN_DES.items():
    df_bulan = extract_bulan(data_rows, identitas, bulan, col_map, is_detail=True)
    if "u0_6" not in df_bulan.columns:
        df_bulan["u0_6"] = np.nan
        df_bulan["u6_11"] = np.nan
        df_bulan["u12_23"] = np.nan
        df_bulan["u24_59"] = np.nan
        df_bulan["kasus_baru"] = np.nan
        df_bulan["lulus"] = np.nan
        df_bulan["kasus_lama"] = np.nan
    semua_bulan.append(df_bulan)

df_final = pd.concat(semua_bulan, ignore_index=True)

urutan_bulan = ["Januari","Februari","Maret","April","Mei","Juni",
                "Juli","Agustus","September","Oktober","November","Desember"]
df_final["bulan"] = pd.Categorical(df_final["bulan"], categories=urutan_bulan, ordered=True)
df_final = df_final.sort_values(["kelurahan", "bulan"]).reset_index(drop=True)

os.makedirs("data/integrated", exist_ok=True)
df_final.to_csv(OUTPUT_FILE, index=False)