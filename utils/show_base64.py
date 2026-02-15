import base64
import numpy as np
import matplotlib.pyplot as plt

# Parameter ggf. anpassen:
width = 501
height = 501

with open("utils/test_base64.txt", "r") as f:
    b64 = f.read().strip()

# Falls "data:..." Prefix vorhanden, entfernen
if "," in b64:
    b64 = b64.split(",")[1]

raw = base64.b64decode(b64)
arr = np.frombuffer(raw, dtype=np.float32)
if arr.size != width * height:
    raise ValueError(f"Array size {arr.size} passt nicht zu width*height={width*height}")


arr = arr.reshape((height, width)).copy()  # ensure writable
# Replace nodata values with np.nan for clean plotting
nodata = -3.4028235e+38
arr[arr == nodata] = np.nan

plt.imshow(arr, cmap="terrain")
plt.colorbar(label="Höhe")
plt.title("DEM Höhen aus base64")
plt.show()