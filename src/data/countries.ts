export interface Country {
	name: string;
	code: string;
	flag: string;
	phoneCode: string;
	region: string;
}

export interface CountryFlag {
	flag: string;
	country: string;
	code: string;
}

// Import the flag data
import countryFlags from "./country-flag.json";

export const countries: Country[] = [
	// Asia
	{
		name: "Afghanistan",
		code: "AF",
		flag: "🇦🇫",
		phoneCode: "+93",
		region: "Asia",
	},
	{
		name: "Armenia",
		code: "AM",
		flag: "🇦🇲",
		phoneCode: "+374",
		region: "Asia",
	},
	{
		name: "Azerbaijan",
		code: "AZ",
		flag: "🇦🇿",
		phoneCode: "+994",
		region: "Asia",
	},
	{
		name: "Bahrain",
		code: "BH",
		flag: "🇧🇭",
		phoneCode: "+973",
		region: "Asia",
	},
	{
		name: "Bangladesh",
		code: "BD",
		flag: "🇧🇩",
		phoneCode: "+880",
		region: "Asia",
	},
	{
		name: "Bhutan",
		code: "BT",
		flag: "🇧🇹",
		phoneCode: "+975",
		region: "Asia",
	},
	{
		name: "Brunei",
		code: "BN",
		flag: "🇧🇳",
		phoneCode: "+673",
		region: "Asia",
	},
	{
		name: "Cambodia",
		code: "KH",
		flag: "🇰🇭",
		phoneCode: "+855",
		region: "Asia",
	},
	{ name: "China", code: "CN", flag: "🇨🇳", phoneCode: "+86", region: "Asia" },
	{
		name: "Cyprus",
		code: "CY",
		flag: "🇨🇾",
		phoneCode: "+357",
		region: "Asia",
	},
	{
		name: "Georgia",
		code: "GE",
		flag: "🇬🇪",
		phoneCode: "+995",
		region: "Asia",
	},
	{ name: "India", code: "IN", flag: "🇮🇳", phoneCode: "+91", region: "Asia" },
	{
		name: "Indonesia",
		code: "ID",
		flag: "🇮🇩",
		phoneCode: "+62",
		region: "Asia",
	},
	{ name: "Iran", code: "IR", flag: "🇮🇷", phoneCode: "+98", region: "Asia" },
	{ name: "Iraq", code: "IQ", flag: "🇮🇶", phoneCode: "+964", region: "Asia" },
	{
		name: "Israel",
		code: "IL",
		flag: "🇮🇱",
		phoneCode: "+972",
		region: "Asia",
	},
	{ name: "Japan", code: "JP", flag: "🇯🇵", phoneCode: "+81", region: "Asia" },
	{
		name: "Jordan",
		code: "JO",
		flag: "🇯🇴",
		phoneCode: "+962",
		region: "Asia",
	},
	{
		name: "Kazakhstan",
		code: "KZ",
		flag: "🇰🇿",
		phoneCode: "+7",
		region: "Asia",
	},
	{
		name: "Kuwait",
		code: "KW",
		flag: "🇰🇼",
		phoneCode: "+965",
		region: "Asia",
	},
	{
		name: "Kyrgyzstan",
		code: "KG",
		flag: "🇰🇬",
		phoneCode: "+996",
		region: "Asia",
	},
	{ name: "Laos", code: "LA", flag: "🇱🇦", phoneCode: "+856", region: "Asia" },
	{
		name: "Lebanon",
		code: "LB",
		flag: "🇱🇧",
		phoneCode: "+961",
		region: "Asia",
	},
	{
		name: "Malaysia",
		code: "MY",
		flag: "🇲🇾",
		phoneCode: "+60",
		region: "Asia",
	},
	{
		name: "Maldives",
		code: "MV",
		flag: "🇲🇻",
		phoneCode: "+960",
		region: "Asia",
	},
	{
		name: "Mongolia",
		code: "MN",
		flag: "🇲🇳",
		phoneCode: "+976",
		region: "Asia",
	},
	{
		name: "Myanmar",
		code: "MM",
		flag: "🇲🇲",
		phoneCode: "+95",
		region: "Asia",
	},
	{
		name: "Nepal",
		code: "NP",
		flag: "🇳🇵",
		phoneCode: "+977",
		region: "Asia",
	},
	{
		name: "North Korea",
		code: "KP",
		flag: "🇰🇵",
		phoneCode: "+850",
		region: "Asia",
	},
	{ name: "Oman", code: "OM", flag: "🇴🇲", phoneCode: "+968", region: "Asia" },
	{
		name: "Pakistan",
		code: "PK",
		flag: "🇵🇰",
		phoneCode: "+92",
		region: "Asia",
	},
	{
		name: "Palestine",
		code: "PS",
		flag: "🇵🇸",
		phoneCode: "+970",
		region: "Asia",
	},
	{
		name: "Philippines",
		code: "PH",
		flag: "🇵🇭",
		phoneCode: "+63",
		region: "Asia",
	},
	{
		name: "Qatar",
		code: "QA",
		flag: "🇶🇦",
		phoneCode: "+974",
		region: "Asia",
	},
	{
		name: "Saudi Arabia",
		code: "SA",
		flag: "🇸🇦",
		phoneCode: "+966",
		region: "Asia",
	},
	{
		name: "Singapore",
		code: "SG",
		flag: "🇸🇬",
		phoneCode: "+65",
		region: "Asia",
	},
	{
		name: "South Korea",
		code: "KR",
		flag: "🇰🇷",
		phoneCode: "+82",
		region: "Asia",
	},
	{
		name: "Sri Lanka",
		code: "LK",
		flag: "🇱🇰",
		phoneCode: "+94",
		region: "Asia",
	},
	{
		name: "Syria",
		code: "SY",
		flag: "🇸🇾",
		phoneCode: "+963",
		region: "Asia",
	},
	{
		name: "Taiwan",
		code: "TW",
		flag: "🇹🇼",
		phoneCode: "+886",
		region: "Asia",
	},
	{
		name: "Tajikistan",
		code: "TJ",
		flag: "🇹🇯",
		phoneCode: "+992",
		region: "Asia",
	},
	{
		name: "Thailand",
		code: "TH",
		flag: "🇹🇭",
		phoneCode: "+66",
		region: "Asia",
	},
	{
		name: "Timor-Leste",
		code: "TL",
		flag: "🇹🇱",
		phoneCode: "+670",
		region: "Asia",
	},
	{
		name: "Turkey",
		code: "TR",
		flag: "🇹🇷",
		phoneCode: "+90",
		region: "Asia",
	},
	{
		name: "Turkmenistan",
		code: "TM",
		flag: "🇹🇲",
		phoneCode: "+993",
		region: "Asia",
	},
	{
		name: "United Arab Emirates",
		code: "AE",
		flag: "🇦🇪",
		phoneCode: "+971",
		region: "Asia",
	},
	{
		name: "Uzbekistan",
		code: "UZ",
		flag: "🇺🇿",
		phoneCode: "+998",
		region: "Asia",
	},
	{
		name: "Vietnam",
		code: "VN",
		flag: "🇻🇳",
		phoneCode: "+84",
		region: "Asia",
	},
	{
		name: "Yemen",
		code: "YE",
		flag: "🇾🇪",
		phoneCode: "+967",
		region: "Asia",
	},

	// Europe
	{
		name: "Albania",
		code: "AL",
		flag: "🇦🇱",
		phoneCode: "+355",
		region: "Europe",
	},
	{
		name: "Andorra",
		code: "AD",
		flag: "🇦🇩",
		phoneCode: "+376",
		region: "Europe",
	},
	{
		name: "Austria",
		code: "AT",
		flag: "🇦🇹",
		phoneCode: "+43",
		region: "Europe",
	},
	{
		name: "Belarus",
		code: "BY",
		flag: "🇧🇾",
		phoneCode: "+375",
		region: "Europe",
	},
	{
		name: "Belgium",
		code: "BE",
		flag: "🇧🇪",
		phoneCode: "+32",
		region: "Europe",
	},
	{
		name: "Bosnia and Herzegovina",
		code: "BA",
		flag: "🇧🇦",
		phoneCode: "+387",
		region: "Europe",
	},
	{
		name: "Bulgaria",
		code: "BG",
		flag: "🇧🇬",
		phoneCode: "+359",
		region: "Europe",
	},
	{
		name: "Croatia",
		code: "HR",
		flag: "🇭🇷",
		phoneCode: "+385",
		region: "Europe",
	},
	{
		name: "Cyprus",
		code: "CY",
		flag: "🇨🇾",
		phoneCode: "+357",
		region: "Europe",
	},
	{
		name: "Czech Republic",
		code: "CZ",
		flag: "🇨🇿",
		phoneCode: "+420",
		region: "Europe",
	},
	{
		name: "Denmark",
		code: "DK",
		flag: "🇩🇰",
		phoneCode: "+45",
		region: "Europe",
	},
	{
		name: "Estonia",
		code: "EE",
		flag: "🇪🇪",
		phoneCode: "+372",
		region: "Europe",
	},
	{
		name: "Finland",
		code: "FI",
		flag: "🇫🇮",
		phoneCode: "+358",
		region: "Europe",
	},
	{
		name: "France",
		code: "FR",
		flag: "🇫🇷",
		phoneCode: "+33",
		region: "Europe",
	},
	{
		name: "Germany",
		code: "DE",
		flag: "🇩🇪",
		phoneCode: "+49",
		region: "Europe",
	},
	{
		name: "Greece",
		code: "GR",
		flag: "🇬🇷",
		phoneCode: "+30",
		region: "Europe",
	},
	{
		name: "Hungary",
		code: "HU",
		flag: "🇭🇺",
		phoneCode: "+36",
		region: "Europe",
	},
	{
		name: "Iceland",
		code: "IS",
		flag: "🇮🇸",
		phoneCode: "+354",
		region: "Europe",
	},
	{
		name: "Ireland",
		code: "IE",
		flag: "🇮🇪",
		phoneCode: "+353",
		region: "Europe",
	},
	{
		name: "Italy",
		code: "IT",
		flag: "🇮🇹",
		phoneCode: "+39",
		region: "Europe",
	},
	{
		name: "Latvia",
		code: "LV",
		flag: "🇱🇻",
		phoneCode: "+371",
		region: "Europe",
	},
	{
		name: "Liechtenstein",
		code: "LI",
		flag: "🇱🇮",
		phoneCode: "+423",
		region: "Europe",
	},
	{
		name: "Lithuania",
		code: "LT",
		flag: "🇱🇹",
		phoneCode: "+370",
		region: "Europe",
	},
	{
		name: "Luxembourg",
		code: "LU",
		flag: "🇱🇺",
		phoneCode: "+352",
		region: "Europe",
	},
	{
		name: "Malta",
		code: "MT",
		flag: "🇲🇹",
		phoneCode: "+356",
		region: "Europe",
	},
	{
		name: "Moldova",
		code: "MD",
		flag: "🇲🇩",
		phoneCode: "+373",
		region: "Europe",
	},
	{
		name: "Monaco",
		code: "MC",
		flag: "🇲🇨",
		phoneCode: "+377",
		region: "Europe",
	},
	{
		name: "Montenegro",
		code: "ME",
		flag: "🇲🇪",
		phoneCode: "+382",
		region: "Europe",
	},
	{
		name: "Netherlands",
		code: "NL",
		flag: "🇳🇱",
		phoneCode: "+31",
		region: "Europe",
	},
	{
		name: "North Macedonia",
		code: "MK",
		flag: "🇲🇰",
		phoneCode: "+389",
		region: "Europe",
	},
	{
		name: "Norway",
		code: "NO",
		flag: "🇳🇴",
		phoneCode: "+47",
		region: "Europe",
	},
	{
		name: "Poland",
		code: "PL",
		flag: "🇵🇱",
		phoneCode: "+48",
		region: "Europe",
	},
	{
		name: "Portugal",
		code: "PT",
		flag: "🇵🇹",
		phoneCode: "+351",
		region: "Europe",
	},
	{
		name: "Romania",
		code: "RO",
		flag: "🇷🇴",
		phoneCode: "+40",
		region: "Europe",
	},
	{
		name: "Russia",
		code: "RU",
		flag: "🇷🇺",
		phoneCode: "+7",
		region: "Europe",
	},
	{
		name: "San Marino",
		code: "SM",
		flag: "🇸🇲",
		phoneCode: "+378",
		region: "Europe",
	},
	{
		name: "Serbia",
		code: "RS",
		flag: "🇷🇸",
		phoneCode: "+381",
		region: "Europe",
	},
	{
		name: "Slovakia",
		code: "SK",
		flag: "🇸🇰",
		phoneCode: "+421",
		region: "Europe",
	},
	{
		name: "Slovenia",
		code: "SI",
		flag: "🇸🇮",
		phoneCode: "+386",
		region: "Europe",
	},
	{
		name: "Spain",
		code: "ES",
		flag: "🇪🇸",
		phoneCode: "+34",
		region: "Europe",
	},
	{
		name: "Sweden",
		code: "SE",
		flag: "🇸🇪",
		phoneCode: "+46",
		region: "Europe",
	},
	{
		name: "Switzerland",
		code: "CH",
		flag: "🇨🇭",
		phoneCode: "+41",
		region: "Europe",
	},
	{
		name: "Ukraine",
		code: "UA",
		flag: "🇺🇦",
		phoneCode: "+380",
		region: "Europe",
	},
	{
		name: "United Kingdom",
		code: "GB",
		flag: "🇬🇧",
		phoneCode: "+44",
		region: "Europe",
	},
	{
		name: "Vatican City",
		code: "VA",
		flag: "🇻🇦",
		phoneCode: "+379",
		region: "Europe",
	},

	// North America
	{
		name: "Canada",
		code: "CA",
		flag: "🇨🇦",
		phoneCode: "+1",
		region: "North America",
	},
	{
		name: "Mexico",
		code: "MX",
		flag: "🇲🇽",
		phoneCode: "+52",
		region: "North America",
	},
	{
		name: "United States",
		code: "US",
		flag: "🇺🇸",
		phoneCode: "+1",
		region: "North America",
	},

	// South America
	{
		name: "Argentina",
		code: "AR",
		flag: "🇦🇷",
		phoneCode: "+54",
		region: "South America",
	},
	{
		name: "Bolivia",
		code: "BO",
		flag: "🇧🇴",
		phoneCode: "+591",
		region: "South America",
	},
	{
		name: "Brazil",
		code: "BR",
		flag: "🇧🇷",
		phoneCode: "+55",
		region: "South America",
	},
	{
		name: "Chile",
		code: "CL",
		flag: "🇨🇱",
		phoneCode: "+56",
		region: "South America",
	},
	{
		name: "Colombia",
		code: "CO",
		flag: "🇨🇴",
		phoneCode: "+57",
		region: "South America",
	},
	{
		name: "Ecuador",
		code: "EC",
		flag: "🇪🇨",
		phoneCode: "+593",
		region: "South America",
	},
	{
		name: "Guyana",
		code: "GY",
		flag: "🇬🇾",
		phoneCode: "+592",
		region: "South America",
	},
	{
		name: "Paraguay",
		code: "PY",
		flag: "🇵🇾",
		phoneCode: "+595",
		region: "South America",
	},
	{
		name: "Peru",
		code: "PE",
		flag: "🇵🇪",
		phoneCode: "+51",
		region: "South America",
	},
	{
		name: "Suriname",
		code: "SR",
		flag: "🇸🇷",
		phoneCode: "+597",
		region: "South America",
	},
	{
		name: "Uruguay",
		code: "UY",
		flag: "🇺🇾",
		phoneCode: "+598",
		region: "South America",
	},
	{
		name: "Venezuela",
		code: "VE",
		flag: "🇻🇪",
		phoneCode: "+58",
		region: "South America",
	},

	// Africa
	{
		name: "Algeria",
		code: "DZ",
		flag: "🇩🇿",
		phoneCode: "+213",
		region: "Africa",
	},
	{
		name: "Angola",
		code: "AO",
		flag: "🇦🇴",
		phoneCode: "+244",
		region: "Africa",
	},
	{
		name: "Benin",
		code: "BJ",
		flag: "🇧🇯",
		phoneCode: "+229",
		region: "Africa",
	},
	{
		name: "Botswana",
		code: "BW",
		flag: "🇧🇼",
		phoneCode: "+267",
		region: "Africa",
	},
	{
		name: "Burkina Faso",
		code: "BF",
		flag: "🇧🇫",
		phoneCode: "+226",
		region: "Africa",
	},
	{
		name: "Burundi",
		code: "BI",
		flag: "🇧🇮",
		phoneCode: "+257",
		region: "Africa",
	},
	{
		name: "Cameroon",
		code: "CM",
		flag: "🇨🇲",
		phoneCode: "+237",
		region: "Africa",
	},
	{
		name: "Cape Verde",
		code: "CV",
		flag: "🇨🇻",
		phoneCode: "+238",
		region: "Africa",
	},
	{
		name: "Central African Republic",
		code: "CF",
		flag: "🇨🇫",
		phoneCode: "+236",
		region: "Africa",
	},
	{
		name: "Chad",
		code: "TD",
		flag: "🇹🇩",
		phoneCode: "+235",
		region: "Africa",
	},
	{
		name: "Comoros",
		code: "KM",
		flag: "🇰🇲",
		phoneCode: "+269",
		region: "Africa",
	},
	{
		name: "Congo",
		code: "CG",
		flag: "🇨🇬",
		phoneCode: "+242",
		region: "Africa",
	},
	{
		name: "Democratic Republic of the Congo",
		code: "CD",
		flag: "🇨🇩",
		phoneCode: "+243",
		region: "Africa",
	},
	{
		name: "Djibouti",
		code: "DJ",
		flag: "🇩🇯",
		phoneCode: "+253",
		region: "Africa",
	},
	{
		name: "Egypt",
		code: "EG",
		flag: "🇪🇬",
		phoneCode: "+20",
		region: "Africa",
	},
	{
		name: "Equatorial Guinea",
		code: "GQ",
		flag: "🇬🇶",
		phoneCode: "+240",
		region: "Africa",
	},
	{
		name: "Eritrea",
		code: "ER",
		flag: "🇪🇷",
		phoneCode: "+291",
		region: "Africa",
	},
	{
		name: "Eswatini",
		code: "SZ",
		flag: "🇸🇿",
		phoneCode: "+268",
		region: "Africa",
	},
	{
		name: "Ethiopia",
		code: "ET",
		flag: "🇪🇹",
		phoneCode: "+251",
		region: "Africa",
	},
	{
		name: "Gabon",
		code: "GA",
		flag: "🇬🇦",
		phoneCode: "+241",
		region: "Africa",
	},
	{
		name: "Gambia",
		code: "GM",
		flag: "🇬🇲",
		phoneCode: "+220",
		region: "Africa",
	},
	{
		name: "Ghana",
		code: "GH",
		flag: "🇬🇭",
		phoneCode: "+233",
		region: "Africa",
	},
	{
		name: "Guinea",
		code: "GN",
		flag: "🇬🇳",
		phoneCode: "+224",
		region: "Africa",
	},
	{
		name: "Guinea-Bissau",
		code: "GW",
		flag: "🇬🇼",
		phoneCode: "+245",
		region: "Africa",
	},
	{
		name: "Ivory Coast",
		code: "CI",
		flag: "🇨🇮",
		phoneCode: "+225",
		region: "Africa",
	},
	{
		name: "Kenya",
		code: "KE",
		flag: "🇰🇪",
		phoneCode: "+254",
		region: "Africa",
	},
	{
		name: "Lesotho",
		code: "LS",
		flag: "🇱🇸",
		phoneCode: "+266",
		region: "Africa",
	},
	{
		name: "Liberia",
		code: "LR",
		flag: "🇱🇷",
		phoneCode: "+231",
		region: "Africa",
	},
	{
		name: "Libya",
		code: "LY",
		flag: "🇱🇾",
		phoneCode: "+218",
		region: "Africa",
	},
	{
		name: "Madagascar",
		code: "MG",
		flag: "🇲🇬",
		phoneCode: "+261",
		region: "Africa",
	},
	{
		name: "Malawi",
		code: "MW",
		flag: "🇲🇼",
		phoneCode: "+265",
		region: "Africa",
	},
	{
		name: "Mali",
		code: "ML",
		flag: "🇲🇱",
		phoneCode: "+223",
		region: "Africa",
	},
	{
		name: "Mauritania",
		code: "MR",
		flag: "🇲🇷",
		phoneCode: "+222",
		region: "Africa",
	},
	{
		name: "Mauritius",
		code: "MU",
		flag: "🇲🇺",
		phoneCode: "+230",
		region: "Africa",
	},
	{
		name: "Morocco",
		code: "MA",
		flag: "🇲🇦",
		phoneCode: "+212",
		region: "Africa",
	},
	{
		name: "Mozambique",
		code: "MZ",
		flag: "🇲🇿",
		phoneCode: "+258",
		region: "Africa",
	},
	{
		name: "Namibia",
		code: "NA",
		flag: "🇳🇦",
		phoneCode: "+264",
		region: "Africa",
	},
	{
		name: "Niger",
		code: "NE",
		flag: "🇳🇪",
		phoneCode: "+227",
		region: "Africa",
	},
	{
		name: "Nigeria",
		code: "NG",
		flag: "🇳🇬",
		phoneCode: "+234",
		region: "Africa",
	},
	{
		name: "Rwanda",
		code: "RW",
		flag: "🇷🇼",
		phoneCode: "+250",
		region: "Africa",
	},
	{
		name: "São Tomé and Príncipe",
		code: "ST",
		flag: "🇸🇹",
		phoneCode: "+239",
		region: "Africa",
	},
	{
		name: "Senegal",
		code: "SN",
		flag: "🇸🇳",
		phoneCode: "+221",
		region: "Africa",
	},
	{
		name: "Seychelles",
		code: "SC",
		flag: "🇸🇨",
		phoneCode: "+248",
		region: "Africa",
	},
	{
		name: "Sierra Leone",
		code: "SL",
		flag: "🇸🇱",
		phoneCode: "+232",
		region: "Africa",
	},
	{
		name: "Somalia",
		code: "SO",
		flag: "🇸🇴",
		phoneCode: "+252",
		region: "Africa",
	},
	{
		name: "South Africa",
		code: "ZA",
		flag: "🇿🇦",
		phoneCode: "+27",
		region: "Africa",
	},
	{
		name: "South Sudan",
		code: "SS",
		flag: "🇸🇸",
		phoneCode: "+211",
		region: "Africa",
	},
	{
		name: "Sudan",
		code: "SD",
		flag: "🇸🇩",
		phoneCode: "+249",
		region: "Africa",
	},
	{
		name: "Tanzania",
		code: "TZ",
		flag: "🇹🇿",
		phoneCode: "+255",
		region: "Africa",
	},
	{
		name: "Togo",
		code: "TG",
		flag: "🇹🇬",
		phoneCode: "+228",
		region: "Africa",
	},
	{
		name: "Tunisia",
		code: "TN",
		flag: "🇹🇳",
		phoneCode: "+216",
		region: "Africa",
	},
	{
		name: "Uganda",
		code: "UG",
		flag: "🇺🇬",
		phoneCode: "+256",
		region: "Africa",
	},
	{
		name: "Zambia",
		code: "ZM",
		flag: "🇿🇲",
		phoneCode: "+260",
		region: "Africa",
	},
	{
		name: "Zimbabwe",
		code: "ZW",
		flag: "🇿🇼",
		phoneCode: "+263",
		region: "Africa",
	},

	// Oceania
	{
		name: "Australia",
		code: "AU",
		flag: "🇦🇺",
		phoneCode: "+61",
		region: "Oceania",
	},
	{
		name: "Fiji",
		code: "FJ",
		flag: "🇫🇯",
		phoneCode: "+679",
		region: "Oceania",
	},
	{
		name: "Kiribati",
		code: "KI",
		flag: "🇰🇮",
		phoneCode: "+686",
		region: "Oceania",
	},
	{
		name: "Marshall Islands",
		code: "MH",
		flag: "🇲🇭",
		phoneCode: "+692",
		region: "Oceania",
	},
	{
		name: "Micronesia",
		code: "FM",
		flag: "🇫🇲",
		phoneCode: "+691",
		region: "Oceania",
	},
	{
		name: "Nauru",
		code: "NR",
		flag: "🇳🇷",
		phoneCode: "+674",
		region: "Oceania",
	},
	{
		name: "New Zealand",
		code: "NZ",
		flag: "🇳🇿",
		phoneCode: "+64",
		region: "Oceania",
	},
	{
		name: "Palau",
		code: "PW",
		flag: "🇵🇼",
		phoneCode: "+680",
		region: "Oceania",
	},
	{
		name: "Papua New Guinea",
		code: "PG",
		flag: "🇵🇬",
		phoneCode: "+675",
		region: "Oceania",
	},
	{
		name: "Samoa",
		code: "WS",
		flag: "🇼🇸",
		phoneCode: "+685",
		region: "Oceania",
	},
	{
		name: "Solomon Islands",
		code: "SB",
		flag: "🇸🇧",
		phoneCode: "+677",
		region: "Oceania",
	},
	{
		name: "Tonga",
		code: "TO",
		flag: "🇹🇴",
		phoneCode: "+676",
		region: "Oceania",
	},
	{
		name: "Tuvalu",
		code: "TV",
		flag: "🇹🇻",
		phoneCode: "+688",
		region: "Oceania",
	},
	{
		name: "Vanuatu",
		code: "VU",
		flag: "🇻🇺",
		phoneCode: "+678",
		region: "Oceania",
	},
];

// Helper functions
export const getCountryByCode = (code: string): Country | undefined => {
	return countries.find((country) => country.code === code);
};

export const getCountryByPhoneCode = (
	phoneCode: string
): Country | undefined => {
	return countries.find((country) => country.phoneCode === phoneCode);
};

export const getCountriesByRegion = (region: string): Country[] => {
	return countries.filter((country) => country.region === region);
};

export const searchCountries = (query: string): Country[] => {
	const lowercaseQuery = query.toLowerCase();
	return countries.filter(
		(country) =>
			country.name.toLowerCase().includes(lowercaseQuery) ||
			country.code.toLowerCase().includes(lowercaseQuery) ||
			country.phoneCode.includes(query)
	);
};

// Function to get country with SVG flag
export const getCountryWithSvgFlag = (
	countryCode: string
): (Country & { svgFlag?: string }) | undefined => {
	const country = getCountryByCode(countryCode);
	if (!country) return undefined;

	const flagData = countryFlags.find(
		(flag) =>
			typeof flag.code === "string" &&
			typeof country.code === "string" &&
			flag.code.toLowerCase() === country.code.toLowerCase()
	);

	return {
		...country,
		svgFlag: flagData?.flag,
	};
};

// Function to get all countries with SVG flags
export const getCountriesWithSvgFlags = (): (Country & {
	svgFlag?: string;
})[] => {
	return countries.map((country) => {
		const flagData = countryFlags.find(
			(flag) =>
				typeof flag.code === "string" &&
				typeof country.code === "string" &&
				flag.code.toLowerCase() === country.code.toLowerCase()
		);

		return {
			...country,
			// Use emoji flag as fallback if SVG fails to load
			svgFlag: flagData?.flag,
		};
	});
};
