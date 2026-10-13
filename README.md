# 🎮 Gaming Corner - Official Esports & Community Portal

**Gaming Corner** adalah platform portal komunitas gaming dan esports modern berarsitektur *full-stack* (**React** & **Node.js/Express**) yang terintegrasi langsung dengan database **MySQL** dan **Discord API**.

Portal ini dirancang untuk memfasilitasi manajemen turnamen esports, toko produk digital/Roblox, sistem klaim role otomatis server Discord, serta visualisasi kartu profil ID anggota (*3D Player Card*).

---

## ✨ Fitur Utama

### 🏆 1. Tournament Arena (`/tournaments`)
* **Live Dynamic Status**: Menampilkan daftar turnamen dengan filter kategori status (*All*, *Upcoming*, *Ongoing*, dan *Finished*).
* **Cyber Aesthetic Card**: Desain kartu turnamen futuristik dengan *backdrop glassmorphism* dan statistik hadiah (*Prize Pool*).
* **Lazy-Loading Video/Media**: Mendukung embed video YouTube/TikTok dengan sistem *poster preview* untuk performa cepat dan konsol log yang bersih.
* **Real-time Search & Pagination**: Fitur pencarian judul event/game secara instant beserta kontrol navigasi halaman.
* **Skeleton Loading**: Visual animasi placeholder saat data sedang diambil dari database.

### 👤 2. Discord Authentication & Player Card ID
* **OAuth2 Discord Login**: Autentikasi akun Discord yang aman tanpa menyimpan password.
* **Interactive 3D Player Card Modal**: Menampilkan ID Pass komunitas pengguna lengkap dengan avatar Discord dan detail role.

### 🤖 3. Discord Bot & Role Claim System
* **Automatic Role Claiming**: Pengguna yang telah login dapat mengklaim role khusus di server Discord Gaming Corner (seperti *Web Member*, *Loyalis*, *Topup*, atau *Tournament Participant*) hanya dengan satu kali klik melalui REST API Discord.

### 🛒 4. Roblox & Digital Store (`/shop`)
* **Katalog Produk Digital**: Menampilkan item Roblox, top-up Robux, dan merchandise game dengan filter kategori.

### 🗺️ 5. Member Journey & Hall of Fame (`/journey`)
* **Milestone Tracking**: Halaman dedikasi untuk melihat perjalanan komunitas, pencapaian member, dan riwayat event.

### ⚙️ 6. Admin Panel (Protected CRUD)
* **Manajemen Turnamen**: Tambah, edit, dan hapus event turnamen.
* **Upload Media File (Multer)**: Mendukung upload file poster/video lokal langsung ke server internal.

---

## 🛠️ Tech Stack

* **Frontend**: React.js, Vite, Tailwind CSS, Lucide React (Icons), Axios, React Router DOM.
* **Backend**: Node.js, Express.js, JWT (JSON Web Token), Axios, Multer (File Upload Handling).
* **Database**: MySQL.
* **Integrasi Eksternal**: Discord REST API v10 (OAuth2 & Bot Integration).

---

## 🚀 Panduan Setup & Instalasi (How to Clone & Run)

### 📋 Prasyarat
Pastikan aplikasi berikut sudah terinstal di komputer kamu:
* [Node.js](https://nodejs.org/) (Versi 18+)
* [MySQL Database](https://www.mysql.com/) (XAMPP / MySQL Workbench / Docker)
* [Git](https://git-scm.com/)

---

### 1. Clone Repository
Buka terminal / Command Prompt dan jalankan perintah:
```bash
git clone [https://github.com/username-kamu/gaming-corner.git](https://github.com/username-kamu/gaming-corner.git)
cd gaming-corner