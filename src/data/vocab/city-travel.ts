import { pack, type TopicPack } from './types';

/** Getting around: the city, journeys, countries and public life. */
export const CITY_PACKS: TopicPack[] = [
  pack(
    { id: 'airport', title: 'At the Airport', icon: '✈️', blurb: 'Flights, checks and gates.', level: 'intermediate' },
    [
      ['w-hawai-adda', 'ہوائی اڈہ', 'hawaai aḍḍa', 'airport', '🛫'],
      ['w-jahaz2', 'ہوائی جہاز', 'hawaai jahaaz', 'aeroplane', '✈️'],
      ['w-parwaz', 'پرواز', 'parwaaz', 'flight', '🛩️'],
      ['w-musafir', 'مسافر', 'musaafir', 'passenger', '🧳'],
      ['w-visa', 'ویزا', 'weeza', 'visa', '📗'],
      ['w-saman-check', 'سامان کی جانچ', 'saamaan ki jaanch', 'baggage check', '🧳'],
      ['w-intezar-gah', 'انتظار گاہ', 'intezaar-gaah', 'waiting area', '🪑'],
      ['w-rawangi', 'روانگی', 'rawaangi', 'departure', '🛫'],
      ['w-khidmatgar', 'فضائی میزبان', 'fazaai mezbaan', 'flight attendant', '🧑‍✈️'],
      ['w-pilot', 'پائلٹ', 'paaeloṭ', 'pilot', '👨‍✈️'],
      ['w-udaan', 'اڑان', 'uṛaan', 'take-off', '🛫'],
      ['w-landing', 'لینڈنگ', 'laiñḍing', 'landing', '🛬'],
      ['w-guzarnama', 'اجازت نامہ', 'ijaazat-naama', 'permit', '📄'],
      ['w-safar-nama', 'سفرنامہ', 'safar-naama', 'travelogue', '📔'],
    ]
  ),
  pack(
    { id: 'road', title: 'On the Road', icon: '🛣️', blurb: 'Driving, traffic and signs.', level: 'elementary' },
    [
      ['w-signal', 'سگنل', 'signal', 'traffic signal', '🚥'],
      ['w-driver', 'ڈرائیور', 'ḍraaiwar', 'driver', '🧑‍✈️'],
      ['w-petrol', 'پٹرول', 'peṭrol', 'petrol', '⛽'],
      ['w-brake', 'بریک', 'brek', 'brake', '🛑'],
      ['w-rukna', 'رکنا', 'rukna', 'to stop', '✋'],
      ['w-mudna', 'مڑنا', 'muṛna', 'to turn', '↩️'],
      ['w-tez-chalna', 'تیز چلانا', 'tez chalaana', 'to speed', '💨'],
      ['w-adda', 'اڈہ', 'aḍḍa', 'terminal / stand', '🚏'],
      ['w-station', 'اسٹیشن', 'sṭeshan', 'station', '🚉'],
      ['w-safar-karna', 'سفر کرنا', 'safar karna', 'to travel', '🧳'],
      ['w-raasta', 'راستہ', 'raasta', 'way / route', '🧭'],
      ['w-mor-bend', 'موڑ', 'moṛ', 'bend / turning', '🔄'],
      ['w-nishaan', 'نشان', 'nishaan', 'sign / mark', '🪧'],
      ['w-faasla', 'فاصلہ', 'faasla', 'distance', '📏'],
    ]
  ),
  pack(
    { id: 'countries', title: 'Countries & Peoples', icon: '🌍', blurb: 'Places on the map.', level: 'intermediate' },
    [
      ['w-pakistan', 'پاکستان', 'paakistaan', 'Pakistan', '🇵🇰'],
      ['w-hindustan', 'ہندوستان', 'hindustaan', 'India', '🇮🇳'],
      ['w-inglistan', 'انگلستان', 'inglistaan', 'England', '🏴'],
      ['w-amreeka', 'امریکہ', 'amreeka', 'America', '🗽'],
      ['w-arab', 'عرب', 'arab', 'Arabia', '🕋'],
      ['w-iran', 'ایران', 'eeraan', 'Iran', '🏛️'],
      ['w-turki', 'ترکی', 'turki', 'Turkey', '🌉'],
      ['w-cheen', 'چین', 'cheen', 'China', '🏯'],
      ['w-qaum', 'قوم', 'qaum', 'nation / people', '👥'],
      ['w-zabaan2', 'زبان', 'zabaan', 'language', '💬'],
      ['w-angrezi', 'انگریزی', 'angrezi', 'English', '🔤'],
      ['w-paayatakht', 'دارالحکومت', 'daar-ul-hukoomat', 'capital city', '🏛️'],
      ['w-jhanda', 'جھنڈا', 'jhanḍa', 'flag', '🚩'],
      ['w-sarhad2', 'سرحد', 'sarhad', 'frontier', '🚧'],
    ]
  ),
  pack(
    { id: 'services', title: 'Public Services', icon: '🧰', blurb: 'Offices, help and officials.', level: 'advanced' },
    [
      ['w-hukoomat', 'حکومت', 'hukoomat', 'government', '🏛️'],
      ['w-afsar', 'افسر', 'afsar', 'officer', '🎖️'],
      ['w-police', 'پولیس', 'polees', 'police', '👮'],
      ['w-fauj', 'فوج', 'fauj', 'army', '🪖'],
      ['w-judge', 'جج', 'jaj', 'judge', '👨‍⚖️'],
      ['w-qanoon', 'قانون', 'qaanoon', 'law', '📜'],
      ['w-tax', 'ٹیکس', 'ṭaiks', 'tax', '🧾'],
      ['w-darkhwast', 'درخواست', 'darkhwaast', 'application / request', '📝'],
      ['w-daftar2', 'محکمہ', 'mehkma', 'department', '🏢'],
      ['w-ijlaas', 'اجلاس', 'ijlaas', 'meeting / session', '👥'],
      ['w-faisla', 'فیصلہ', 'faisla', 'decision', '⚖️'],
      ['w-shikayat', 'شکایت', 'shikaayat', 'complaint', '📢'],
      ['w-imdaad', 'امداد', 'imdaad', 'aid / assistance', '🤝'],
      ['w-hospital2', 'شفاخانہ', 'shifaa-khaana', 'clinic', '🏥'],
      ['w-madrasa', 'مدرسہ', 'madrasa', 'school (traditional)', '🕌'],
      ['w-bijli-ghar', 'بجلی گھر', 'bijli ghar', 'power station', '⚡'],
      ['w-fire-brigade', 'فائر بریگیڈ', 'faayar brigeḍ', 'fire brigade', '🚒'],
      ['w-emergency', 'ہنگامی', 'hangaami', 'emergency', '🚨'],
    ]
  ),
];
