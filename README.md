# Weather Dashboard — Open-Meteo + Google Maps Reverse Geocoding

Dashboard cuaca statis yang bisa di-host di GitHub Pages.

## Fitur

- Input tetap menggunakan **latitude, longitude**.
- Data cuaca real-time dan prakiraan 5 hari dari **Open-Meteo**.
- Koordinat dibalik menjadi nama/alamat lokasi menggunakan **Google Maps Platform — Maps JavaScript API Geocoding Service**.
- Tidak membutuhkan backend untuk dashboard ini; Google Geocoding Service dipanggil dari browser menggunakan API key yang dibatasi untuk website.

## 1. Atur Google Maps API Key

Buka `config.js` dan ganti:

```js
GOOGLE_MAPS_API_KEY: "YOUR_GOOGLE_MAPS_API_KEY"
```

menjadi API key Google Maps milik Anda.

Di Google Cloud:

1. Buat/pilih project.
2. Aktifkan **Maps JavaScript API** dan **Geocoding API**.
3. Aktifkan billing sesuai kebutuhan Google Maps Platform.
4. Buat API key.
5. Batasi key dengan **Websites / HTTP referrers**.
6. Batasi API yang boleh digunakan ke **Maps JavaScript API** dan **Geocoding API**.
7. Untuk GitHub Pages ini, gunakan referrer seperti:

```text
https://kholilmuluk123.github.io/weather-dashboard/*
```

> Jangan menggunakan API key web-service/server-side tanpa pembatasan di frontend. Untuk aplikasi browser, Google menyediakan Geocoding Service melalui Maps JavaScript API.

## 2. Jalankan di GitHub Pages

Upload file berikut ke repository:

- `index.html`
- `style.css`
- `app.js`
- `config.js`

Lalu di **Settings → Pages** pilih:

- Source: **Deploy from a branch**
- Branch: `main`
- Folder: `/(root)`

URL situs:

`https://kholilmuluk123.github.io/weather-dashboard/`

## 3. Format input

Gunakan:

```text
-7.7956, 110.3695
```

atau:

```text
-7.7956 110.3695
```

Input tidak diubah menjadi nama kota. Setelah koordinat dikirim, dashboard akan:

1. mengambil cuaca dari Open-Meteo;
2. meminta reverse geocoding Google Maps;
3. menampilkan `formatted_address` Google sebagai teks lokasi di bawah suhu.

## Catatan keamanan

Karena ini GitHub Pages (frontend publik), API key browser memang dapat terlihat oleh pengguna. Karena itu **wajib gunakan HTTP referrer restriction dan API restriction** pada Google Cloud. Jangan menaruh server-side Geocoding API key yang tidak dibatasi di repository publik.
