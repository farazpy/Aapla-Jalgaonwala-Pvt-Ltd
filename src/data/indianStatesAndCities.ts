export interface StateCityMap {
  [stateName: string]: string[];
}

export const INDIAN_STATES_AND_CITIES: StateCityMap = {
  "Maharashtra": [
    "Jalgaon",
    "Pune",
    "Mumbai",
    "Thane",
    "Nagpur",
    "Nashik",
    "Aurangabad (Chhatrapati Sambhajinagar)",
    "Solapur",
    "Amravati",
    "Kolhapur",
    "Sangli",
    "Nanded",
    "Bhusawal",
    "Chalisgaon",
    "Amalner",
    "Pachora",
    "Chopda",
    "Yawal",
    "Raver",
    "Dhule",
    "Nandurbar",
    "Akola",
    "Latur",
    "Satara"
  ],
  "Gujarat": [
    "Surat",
    "Ahmedabad",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Gandhinagar",
    "Anand",
    "Navsari",
    "Vapi",
    "Valsad",
    "Bharuch"
  ],
  "Madhya Pradesh": [
    "Indore",
    "Bhopal",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
    "Ratlam",
    "Khandwa",
    "Burhanpur"
  ],
  "Delhi": [
    "New Delhi",
    "North Delhi",
    "South Delhi",
    "East Delhi",
    "West Delhi",
    "Central Delhi"
  ],
  "Karnataka": [
    "Bengaluru",
    "Mysuru",
    "Hubballi-Dharwad",
    "Mangaluru",
    "Belagavi",
    "Kalaburagi",
    "Davanagere",
    "Ballari"
  ],
  "Rajasthan": [
    "Jaipur",
    "Jodhpur",
    "Udaipur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Bhilwara",
    "Alwar"
  ],
  "Goa": [
    "Panaji",
    "Margao",
    "Vasco da Gama",
    "Mapusa",
    "Ponda"
  ],
  "Uttar Pradesh": [
    "Noida",
    "Ghaziabad",
    "Lucknow",
    "Kanpur",
    "Varanasi",
    "Agra",
    "Meerut",
    "Prayagraj",
    "Bareilly",
    "Aligarh"
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tiruppur",
    "Erode",
    "Vellore"
  ],
  "Telangana": [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Khammam"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Tirupati"
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Darjeeling",
    "Siliguri",
    "Asansol",
    "Durgapur"
  ],
  "Bihar": [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Purnia"
  ],
  "Punjab": [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda"
  ],
  "Haryana": [
    "Gurugram",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Karnal"
  ],
  "Kerala": [
    "Kochi",
    "Thiruvananthapuram",
    "Kozhikode",
    "Thrissur",
    "Kollam"
  ]
};

export const ALL_STATES = Object.keys(INDIAN_STATES_AND_CITIES).sort();
