/**
 * pakistan_cities.js
 * Sourced directly from src/backend/data/cities.xlsx (rows 2–128, header skipped).
 * Exactly 127 cities with their province — used in the SearchBar city dropdown.
 */

/** Full list grouped by province for the dropdown */
export const CITIES_BY_PROVINCE = {
  "Punjab": [
    "Abdul Hakeem","Ahmadpur East","Alipur Chatha","Arifwala","Attock",
    "Bahawalnagar","Bahawalpur","Basirpur","Bhakkar","Bhalwal","Burewala",
    "Chakwal","Chichawatni","Chiniot","Chishtian","Daska","Depalpur",
    "Dera Ghazi Khan","Faisalabad","Gojra","Gujranwala","Gujrat","Hafizabad",
    "Haroonabad","Jalalpur Jattan","Jampur","Jaranwala","Jatoi","Jatoi Shimali",
    "Jhang","Jhelum","Kamalia","Kamoke","Kasur","Khanewal","Khanpur","Kharian",
    "Khushab","Kot Addu","Lahore","Lalamusa","Layyah","Lodhran","Mandi Bahauddin",
    "Mian Channu","Mianwali","Multan","Muridke","Muzaffargarh","Narowal",
    "Okara","Pakpattan","Pattoki","Phool Nagar","Rahim Yar Khan","Rajanpur",
    "Rawalpindi","Sahiwal","Sambrial","Samundri","Sargodha","Sheikhupura",
    "Shorkot","Shujabad","Sialkot","Taxila","Toba Tek Singh","Vehari",
    "Wah Cantonment",
  ],
  "Sindh": [
    "Badin","Dadu","Daharki","Gambat","Ghotki","Hyderabad","Jacobabad",
    "Kambar","Kamber Ali Khan","Kandhkot","Karachi","Khairpur","Kotri",
    "Larkana","Matiari","Mirpur Khas","Mirpur Mathelo","Naushahro Feroze",
    "Nawabshah","Pano Aqil","Ratodero","Rohri","Sanghar","Sehwan","Shahdadkot",
    "Shahdadpur","Shikarpur","Sujawal","Sukkur","Tando Adam","Tando Allahyar",
    "Tando Muhammad Khan","Thatta","Umerkot",
  ],
  "Khyber Pakhtunkhwa": [
    "Abbottabad","Bannu","Charsadda","Dera Ismail Khan","Haripur","Kohat",
    "Lakki Marwat","Mansehra","Mardan","Mingora (Swat)","Nowshera",
    "Nowshera Cantonment","Peshawar","Shabqadar","Swabi",
  ],
  "Balochistan": [
    "Chaman","Hub","Khuzdar","Quetta","Turbat",
  ],
  "Islamabad Capital Territory": [
    "Islamabad",
  ],
  "Azad Jammu & Kashmir": [
    "Kotli","Mirpur","Muzaffarabad",
  ],
};

/** Flat sorted list for simple filtering */
export const PAKISTAN_CITIES = Object.values(CITIES_BY_PROVINCE)
  .flat()
  .sort((a, b) => a.localeCompare(b));

/** Popular/major cities shown as quick-select chips */
export const POPULAR_CITIES = [
  "Lahore","Karachi","Islamabad","Rawalpindi","Faisalabad",
  "Multan","Peshawar","Quetta","Hyderabad","Sialkot",
];
