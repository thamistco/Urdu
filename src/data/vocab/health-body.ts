import { pack, type TopicPack } from './types';

/** The body in detail, medicine, wellbeing and emergencies. */
export const HEALTH_PACKS: TopicPack[] = [
  pack(
    { id: 'body-more', title: 'More Body Parts', icon: '🦴', blurb: 'Beyond head, hand and foot.', level: 'elementary' },
    [
      ['w-kandha', 'کندھا', 'kandha', 'shoulder', '💪'],
      ['w-kohni', 'کہنی', 'kohni', 'elbow', '💪', 'کُہنی'],
      ['w-ungli', 'انگلی', 'ungli', 'finger', '👆'],
      ['w-seena', 'سینہ', 'seena', 'chest', '🫁'],
      ['w-kamar', 'کمر', 'kamar', 'back / waist', '🧍'],
      ['w-ghutna', 'گھٹنا', 'ghuṭna', 'knee', '🦵'],
      ['w-aidi', 'ایڑی', 'eeṛi', 'heel', '🦶'],
      ['w-galla', 'گلا', 'galla', 'throat', '🗣️'],
      ['w-maatha', 'ماتھا', 'maatha', 'forehead', '😐'],
      ['w-bhoon', 'بھنویں', 'bhaweñ', 'eyebrows', '👁️'],
      ['w-haddi', 'ہڈی', 'haḍḍi', 'bone', '🦴'],
      ['w-jild', 'جلد', 'jild', 'skin', '🫱', 'جِلد'],
    ]
  ),
  pack(
    { id: 'organs', title: 'Inside the Body', icon: '🫀', blurb: 'Organs and inner workings.', level: 'advanced' },
    [
      ['w-dil2', 'قلب', 'qalb', 'heart (organ)', '🫀'],
      ['w-dimaagh', 'دماغ', 'dimaagh', 'brain', '🧠'],
      ['w-phephre', 'پھیپھڑے', 'phepṛe', 'lungs', '🫁'],
      ['w-jigar', 'جگر', 'jigar', 'liver', '🫀'],
      ['w-gurda', 'گردہ', 'gurda', 'kidney', '🫘'],
      ['w-aant', 'آنت', 'aañt', 'intestine', '🌀'],
      ['w-nas', 'نس', 'nas', 'vein / nerve', '🩸'],
      ['w-pattha', 'پٹھا', 'paṭṭha', 'muscle', '💪'],
      ['w-saans', 'سانس', 'saañs', 'breath', '🌬️'],
      ['w-dhadkan', 'دھڑکن', 'dhaṛkan', 'heartbeat', '💓'],
      ['w-hazma', 'ہاضمہ', 'haazma', 'digestion', '🍽️'],
      ['w-nazar', 'نظر', 'nazar', 'eyesight', '👀'],
      ['w-samaat', 'سماعت', 'samaat', 'hearing', '👂'],
      ['w-hosh', 'ہوش', 'hosh', 'consciousness', '💫'],
      ['w-neend', 'نیند', 'neeñd', 'sleep', '😴'],
      ['w-thakan', 'تھکن', 'thakan', 'fatigue', '😮‍💨'],
      ['w-taaqat', 'طاقت', 'taaqat', 'strength', '🏋️'],
      ['w-ghiza', 'غذا', 'ghiza', 'nutrition', '🥗'],
    ]
  ),
  pack(
    { id: 'illness', title: 'Illness & Symptoms', icon: '🤒', blurb: 'When something is wrong.', level: 'intermediate' },
    [
      ['w-nazla', 'نزلہ', 'nazla', 'cold (illness)', '🤧'],
      ['w-zukaam', 'زکام', 'zukaam', 'head cold', '🤧'],
      ['w-pet-dard', 'پیٹ درد', 'peṭ dard', 'stomach ache', '😣'],
      ['w-daant-dard', 'دانت درد', 'daañt dard', 'toothache', '🦷'],
      ['w-chakkar', 'چکر', 'chakkar', 'dizziness', '💫'],
      ['w-ulti', 'الٹی', 'ulṭi', 'vomiting', '🤮'],
      ['w-dast', 'دست', 'dast', 'diarrhoea', '🚽'],
      ['w-kharish', 'خارش', 'khaarish', 'itching', '🐜'],
      ['w-allergy', 'الرجی', 'alarji', 'allergy', '🤧'],
      ['w-bemari', 'بیماری', 'bimaari', 'illness', '🛌'],
      ['w-wabaa', 'وبا', 'wabaa', 'epidemic', '🦠'],
      ['w-injection', 'ٹیکہ', 'ṭeeka', 'injection / vaccine', '💉'],
      ['w-operation', 'آپریشن', 'aapreshan', 'operation', '🔪'],
      ['w-shifa', 'شفا', 'shifa', 'recovery / healing', '🌿'],
    ]
  ),
  pack(
    { id: 'emergency', title: 'Emergencies', icon: '🚨', blurb: 'Urgent help and safety.', level: 'advanced' },
    [
      ['w-khatra', 'خطرہ', 'khatra', 'danger', '⚠️'],
      ['w-madad2', 'بچاؤ', 'bachaao', 'rescue / save', '🆘'],
      ['w-aag2', 'آتشزدگی', 'aatish-zadgi', 'fire (blaze)', '🔥'],
      ['w-chori', 'چوری', 'chori', 'theft', '🕵️'],
      ['w-chor', 'چور', 'chor', 'thief', '🥷'],
      ['w-ambulance', 'ایمبولینس', 'aimbulens', 'ambulance', '🚑'],
      ['w-mareez', 'مریض', 'mareez', 'patient', '🤒'],
      ['w-zakhmi', 'زخمی', 'zakhmi', 'injured', '🤕'],
      ['w-behosh', 'بے ہوش', 'be-hosh', 'unconscious', '😵'],
      ['w-foran', 'فوراً', 'fauran', 'immediately', '⚡'],
      ['w-ehtiyat', 'احتیاط', 'ehtiyaat', 'caution', '🦺'],
      ['w-mehfooz2', 'محفوظ', 'mehfooz', 'safe', '🛡️'],
      ['w-hifaazat', 'حفاظت', 'hifaazat', 'protection', '🛡️'],
      ['w-nigraani', 'نگرانی', 'nigraani', 'supervision', '👁️'],
      ['w-ittila', 'اطلاع', 'ittilaa', 'notification', '📢'],
      ['w-report2', 'رپورٹ درج', 'riporṭ darj', 'to file a report', '📝'],
      ['w-gawah', 'گواہ', 'gawaah', 'witness', '👁️'],
      ['w-bachao-tadbeer', 'تدبیر', 'tadbeer', 'measure / remedy', '🧰'],
      ['w-nikaas', 'نکاس', 'nikaas', 'exit', '🚪'],
      ['w-alarm', 'الارم', 'alaarm', 'alarm', '🔔'],
    ]
  ),
];
