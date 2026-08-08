export type SupportedLanguage = 'en' | 'hi' | 'hinglish' | 'gu';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hinglish', name: 'Hinglish', nativeName: 'Hinglish (Hindi+English)', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🌐' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
];

export interface TranslationDictionary {
  badge: string;
  roleBadge: string;
  heroHeading: string;
  heroSubheading: string;
  states: {
    ready: {
      title: string;
      message: string;
      cta: string;
    };
    connecting: {
      title: string;
      message: string;
      cta: string;
    };
    listening: {
      title: string;
      message: string;
      speakerLabel: string;
    };
    speaking: {
      title: string;
      message: string;
      speakerLabel: string;
    };
    ended: {
      title: string;
      message: string;
      cta: string;
      secondaryCta: string;
    };
    reconnecting: {
      title: string;
      message: string;
    };
  };
  errors: {
    micDeniedTitle: string;
    micDeniedMessage: string;
    micInstructions: string;
    connectionErrorTitle: string;
    connectionErrorMessage: string;
    connectionTimeoutTitle: string;
    connectionTimeoutMessage: string;
    retryBtn: string;
  };
  controls: {
    endCall: string;
    sessionDuration: string;
    privacyNote: string;
    speakingLive: string;
  };
  transcript: {
    title: string;
    subtitle: string;
    emptyText: string;
    emptySubtext: string;
    copyTooltip: string;
    copiedTooltip: string;
    downloadTooltip: string;
    clearTooltip: string;
    youLabel: string;
    assistantLabel: string;
    messagesCount: (count: number) => string;
    toggleShow: string;
    toggleHide: string;
  };
  quickActions: {
    heading: string;
    subheading: string;
    appointment: {
      title: string;
      desc: string;
      samplePrompt: string;
    };
    clinicInfo: {
      title: string;
      desc: string;
      samplePrompt: string;
    };
    doctorMessage: {
      title: string;
      desc: string;
      samplePrompt: string;
    };
  };
  clinicCard: {
    title: string;
    name: string;
    hoursLabel: string;
    hoursValue: string;
    servicesLabel: string;
    servicesList: string[];
    disclaimer: string;
  };
  requestGuide: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    note: string;
  };
  trust: {
    title: string;
    item1Title: string;
    item1Desc: string;
    item2Title: string;
    item2Desc: string;
    item3Title: string;
    item3Desc: string;
    item4Title: string;
    item4Desc: string;
  };
  safety: {
    disclaimerTitle: string;
    disclaimerBody: string;
    emergencyTitle: string;
    emergencyBody: string;
    call108: string;
  };
  footer: {
    tagline: string;
    poweredBy: string;
    madeFor: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  hinglish: {
    badge: 'VOICE FOR BHARAT',
    roleBadge: 'AI Clinic Receptionist',
    heroHeading: 'Your Clinic. Your Voice. Your Saathi.',
    heroSubheading: 'Talk naturally with SehatSaathi AI to get clinic information, request an appointment, or leave a message for the clinic team.',
    states: {
      ready: {
        title: 'Ready to talk',
        message: 'SehatSaathi AI is ready when you are. Baat shuru karein!',
        cta: 'Start Conversation • Baat Shuru Karein',
      },
      connecting: {
        title: 'Connecting to SehatSaathi AI...',
        message: 'Please wait while we connect your voice session.',
        cta: 'Connecting...',
      },
      listening: {
        title: 'Listening to you',
        message: "Go ahead, I'm listening. Aap boliye, main sun rahi hoon.",
        speakerLabel: 'Listening to you',
      },
      speaking: {
        title: 'SehatSaathi is speaking',
        message: "I'm responding to you. Main jawab de rahi hoon.",
        speakerLabel: 'SehatSaathi is speaking',
      },
      ended: {
        title: 'Conversation ended',
        message: 'Thank you for talking with SehatSaathi AI. Call safaltapurvak samapt hui.',
        cta: 'Start Again • Dobara Baat Karein',
        secondaryCta: 'View Clinic Details',
      },
      reconnecting: {
        title: 'Connection interrupted',
        message: "We're trying to reconnect your voice session. Kripya line par bane rahein...",
      },
    },
    errors: {
      micDeniedTitle: 'Microphone access is required',
      micDeniedMessage: 'SehatSaathi AI needs microphone access to hear you. Please allow microphone permission in your browser settings and try again.',
      micInstructions: 'Address bar mein 🔒 lock icon par click karke Microphone ko Allow karein, fir page refresh karein.',
      connectionErrorTitle: "We couldn't connect",
      connectionErrorMessage: 'Something went wrong while connecting to SehatSaathi AI. Please check your internet connection and try again.',
      connectionTimeoutTitle: 'Connection timed out',
      connectionTimeoutMessage: 'Connecting is taking longer than expected. Please check your network and try again.',
      retryBtn: 'Try Again • Dobara Koshish Karein',
    },
    controls: {
      endCall: 'End Conversation',
      sessionDuration: 'Conversation',
      privacyNote: 'Microphone access is used solely for your real-time voice conversation.',
      speakingLive: 'Live audio reactive',
    },
    transcript: {
      title: 'Live Conversation',
      subtitle: 'Real-time conversation transcript',
      emptyText: 'Start speaking — transcript will appear here.',
      emptySubtext: 'Aap Hindi, English, ya Hinglish mein baat kar sakte hain.',
      copyTooltip: 'Copy transcript to clipboard',
      copiedTooltip: 'Copied to clipboard!',
      downloadTooltip: 'Download transcript (.txt)',
      clearTooltip: 'Clear transcript view',
      youLabel: 'You (Caller)',
      assistantLabel: 'SehatSaathi AI (Receptionist)',
      messagesCount: (n: number) => `Live Conversation · ${n} ${n === 1 ? 'message' : 'messages'}`,
      toggleShow: 'Show Live Transcript',
      toggleHide: 'Hide Live Transcript',
    },
    quickActions: {
      heading: 'Quick Voice Actions',
      subheading: 'Try saying any of these to start your conversation:',
      appointment: {
        title: 'Book an Appointment',
        desc: 'Request or reschedule a clinic appointment slot.',
        samplePrompt: '“Mujhe kal subah general checkup ke liye appointment chahiye.”',
      },
      clinicInfo: {
        title: 'Clinic Information',
        desc: 'Check clinic timings, location, or departments.',
        samplePrompt: '“Clinic ke opening timings aur available services kya hain?”',
      },
      doctorMessage: {
        title: 'Leave a Message',
        desc: 'Leave a message for the clinic doctor team.',
        samplePrompt: '“Doctor ke liye ek callback message note kar lijiye.”',
      },
    },
    clinicCard: {
      title: 'Sunrise Family Clinic',
      name: 'Sunrise Family Clinic',
      hoursLabel: 'Clinic Timings',
      hoursValue: 'Monday – Saturday · 9:00 AM – 7:00 PM (Sunday Closed)',
      servicesLabel: 'Available Departments',
      servicesList: ['General Medicine', 'Pediatrics (Child Health)', 'Gynecology (Women Health)'],
      disclaimer: 'Note: Appointment requests and messages are recorded by SehatSaathi AI and confirmed directly by Sunrise Family Clinic staff.',
    },
    requestGuide: {
      title: 'How Appointment Requests Work',
      step1: '1. Name',
      step2: '2. Reason for Visit',
      step3: '3. Preferred Date',
      step4: '4. Preferred Time',
      step5: '5. Doctor / Department',
      note: 'SehatSaathi notes your request details cleanly. Final slot confirmation is verified by the clinic.',
    },
    trust: {
      title: 'Designed for Bharat',
      item1Title: 'Voice-First Access',
      item1Desc: 'Zero complicated menus or forms — just speak naturally as you would to a receptionist.',
      item2Title: 'Multilingual & Hinglish',
      item2Desc: 'Naturally understands Hindi, English, and code-mixed conversational Hinglish.',
      item3Title: 'Accurate Clinic Coordination',
      item3Desc: 'Records exact requests, preferences, and messages for verified clinic follow-up.',
      item4Title: 'Strict Medical Safety',
      item4Desc: 'Never gives unverified medical advice or fake confirmations. Built with patient safety first.',
    },
    safety: {
      disclaimerTitle: 'AI Clinic Receptionist Disclaimer',
      disclaimerBody: 'SehatSaathi AI is a virtual clinic receptionist. It does not provide medical diagnosis, treatment advice, prescriptions, or dosage recommendations. For medical concerns, please consult a qualified healthcare professional.',
      emergencyTitle: 'Need urgent medical help?',
      emergencyBody: 'SehatSaathi AI is not an emergency service. If you or someone with you is experiencing chest pain, severe breathlessness, heavy bleeding, or any life-threatening condition, please call 108 or go to the nearest emergency room immediately.',
      call108: 'Call 108 Emergency Service',
    },
    footer: {
      tagline: 'SehatSaathi AI — Voice for Bharat Edition · AI Clinic Receptionist',
      poweredBy: 'Powered by Murf Falcon TTS · Gemini LLM · Deepgram STT · LiveKit Realtime Voice',
      madeFor: 'Built for 10 Days of Voice Agents — Day 3 Challenge',
    },
  },
  hi: {
    badge: 'VOICE FOR BHARAT',
    roleBadge: 'एआई क्लिनिक रिसेप्शनिस्ट',
    heroHeading: 'आपका क्लिनिक। आपकी आवाज़। आपका साथी।',
    heroSubheading: 'क्लिनिक की जानकारी लेने, अपॉइंटमेंट का अनुरोध करने या डॉक्टर के लिए संदेश छोड़ने के लिए सेहतसाथी एआई से बात करें।',
    states: {
      ready: {
        title: 'बात करने के लिए तैयार',
        message: 'सेहतसाथी एआई आपकी मदद के लिए तैयार है। बात शुरू करें!',
        cta: 'बातचीत शुरू करें',
      },
      connecting: {
        title: 'सेहतसाथी एआई से जुड़ रहे हैं...',
        message: 'कृपया प्रतीक्षा करें, आपका वॉयस सत्र कनेक्ट हो रहा है।',
        cta: 'कनेक्ट हो रहा है...',
      },
      listening: {
        title: 'आपकी बात सुन रहे हैं',
        message: 'कृपया बोलिए, मैं सुन रही हूँ।',
        speakerLabel: 'आपकी बात सुन रहे हैं',
      },
      speaking: {
        title: 'सेहतसाथी बोल रही है',
        message: 'मैं आपकी बात का उत्तर दे रही हूँ।',
        speakerLabel: 'सेहतसाथी बोल रही है',
      },
      ended: {
        title: 'बातचीत समाप्त हुई',
        message: 'सेहतसाथी एआई से बात करने के लिए धन्यवाद।',
        cta: 'दोबारा बात करें',
        secondaryCta: 'क्लिनिक जानकारी देखें',
      },
      reconnecting: {
        title: 'कनेक्शन पुनः स्थापित हो रहा है',
        message: 'कृपया लाइन पर बने रहें, हम फिर से कनेक्ट करने का प्रयास कर रहे हैं...',
      },
    },
    errors: {
      micDeniedTitle: 'माइक्रोफ़ोन अनुमति आवश्यक है',
      micDeniedMessage: 'सेहतसाथी एआई को आपकी आवाज़ सुनने के लिए माइक्रोफ़ोन एक्सेस की आवश्यकता है। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।',
      micInstructions: 'एड्रेस बार में 🔒 लॉक आइकन पर क्लिक करके माइक्रोफ़ोन को Allow करें और पेज रीफ्रेश करें।',
      connectionErrorTitle: 'कनेक्शन स्थापित नहीं हो सका',
      connectionErrorMessage: 'सेहतसाथी एआई से कनेक्ट करते समय कोई समस्या आई। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।',
      connectionTimeoutTitle: 'कनेक्शन टाइमआउट',
      connectionTimeoutMessage: 'सत्र कनेक्ट होने में समय लग रहा है। कृपया अपना नेटवर्क जांचें।',
      retryBtn: 'पुनः प्रयास करें',
    },
    controls: {
      endCall: 'बातचीत समाप्त करें',
      sessionDuration: 'कॉल अवधि',
      privacyNote: 'माइक्रोफ़ोन का उपयोग केवल आपकी लाइव बातचीत के लिए किया जाता है।',
      speakingLive: 'ऑडियो एक्टिव',
    },
    transcript: {
      title: 'लाइव बातचीत',
      subtitle: 'रियल-टाइम बातचीत ट्रांसक्रिप्ट',
      emptyText: 'बोलना शुरू करें — ट्रांसक्रिप्ट यहाँ दिखाई देगा।',
      emptySubtext: 'आप हिंदी, इंग्लिश या हिंग्लिश में बोल सकते हैं।',
      copyTooltip: 'ट्रांसक्रिप्ट कॉपी करें',
      copiedTooltip: 'कॉपी हो गया!',
      downloadTooltip: 'ट्रांसक्रिप्ट डाउनलोड करें (.txt)',
      clearTooltip: 'ट्रांसक्रिप्ट साफ़ करें',
      youLabel: 'आप (कॉलर)',
      assistantLabel: 'सेहतसाथी एआई (रिसेप्शनिस्ट)',
      messagesCount: (n: number) => `लाइव बातचीत · ${n} संदेश`,
      toggleShow: 'ट्रांसक्रिप्ट देखें',
      toggleHide: 'ट्रांसक्रिप्ट छिपाएं',
    },
    quickActions: {
      heading: 'त्वरित वॉयस विकल्प',
      subheading: 'बातचीत शुरू करने के लिए इनमें से कुछ भी बोलें:',
      appointment: {
        title: 'अपॉइंटमेंट बुक करें',
        desc: 'क्लिनिक में अपॉइंटमेंट स्लॉट का अनुरोध करें या बदलें।',
        samplePrompt: '“मुझे कल सुबह जनरल चेकअप के लिए अपॉइंटमेंट चाहिए।”',
      },
      clinicInfo: {
        title: 'क्लिनिक की जानकारी',
        desc: 'क्लिनिक का समय, स्थान और उपलब्ध विभाग जानें।',
        samplePrompt: '“क्लिनिक के खुलने का समय और उपलब्ध सेवाएं क्या हैं?”',
      },
      doctorMessage: {
        title: 'डॉक्टर के लिए संदेश',
        desc: 'क्लिनिक की डॉक्टर टीम के लिए एक संदेश छोड़ें।',
        samplePrompt: '“डॉक्टर के लिए एक कॉलबैक मैसेज नोट कर लीजिए।”',
      },
    },
    clinicCard: {
      title: 'सनराइज फैमिली क्लिनिक',
      name: 'सनराइज फैमिली क्लिनिक',
      hoursLabel: 'क्लिनिक का समय',
      hoursValue: 'सोमवार – शनिवार · सुबह 9:00 से शाम 7:00 बजे (रविवार बंद)',
      servicesLabel: 'उपलब्ध विभाग',
      servicesList: ['जनरल मेडिसिन', 'बाल रोग (पीडियाट्रिक्स)', 'स्त्री रोग (गाइनेकोलॉजी)'],
      disclaimer: 'सूचना: अपॉइंटमेंट अनुरोध और संदेश सेहतसाथी एआई द्वारा नोट किए जाते हैं और क्लिनिक कर्मचारियों द्वारा पुष्टि किए जाते हैं।',
    },
    requestGuide: {
      title: 'अपॉइंटमेंट अनुरोध प्रक्रिया',
      step1: '1. नाम',
      step2: '2. आने का कारण',
      step3: '3. पसंदीदा तारीख',
      step4: '4. पसंदीदा समय',
      step5: '5. डॉक्टर / विभाग',
      note: 'सेहतसाथी आपका अनुरोध सुरक्षित रूप से दर्ज करती है। अंतिम पुष्टि क्लिनिक द्वारा की जाती है।',
    },
    trust: {
      title: 'भारत के लिए विशेष रूप से निर्मित',
      item1Title: 'वॉयस-फर्स्ट एक्सेस',
      item1Desc: 'बिना किसी जटिल फॉर्म के — सीधे अपनी आवाज़ में बात करें।',
      item2Title: 'बहुभाषी एवं हिंग्लिश',
      item2Desc: 'हिंदी, अंग्रेजी और मिश्रित भाषा को सहजता से समझती है।',
      item3Title: 'सटीक क्लिनिक समन्वय',
      item3Desc: 'क्लिनिक टीम के लिए सटीक जानकारी और संदेश रिकॉर्ड करती है।',
      item4Title: 'चिकित्सा सुरक्षा का पालन',
      item4Desc: 'कोई अनधिकृत दवा या गलत पुष्टि नहीं। रोगी सुरक्षा सर्वोपरि।',
    },
    safety: {
      disclaimerTitle: 'एआई क्लिनिक रिसेप्शनिस्ट अस्वीकरण',
      disclaimerBody: 'सेहतसाथी एआई एक वर्चुअल क्लिनिक रिसेप्शनिस्ट है। यह कोई चिकित्सीय निदान, उपचार सलाह, नुस्खे या दवा की खुराक नहीं देती है। चिकित्सीय परामर्श के लिए कृपया योग्य डॉक्टर से संपर्क करें।',
      emergencyTitle: 'आपातकालीन सहायता की आवश्यकता है?',
      emergencyBody: 'सेहतसाथी एआई आपातकालीन सेवा नहीं है। यदि सीने में दर्द, सांस लेने में अत्यधिक कठिनाई, या गंभीर चोट जैसी स्थिति है, तो कृपया तुरंत 108 पर कॉल करें या नजदीकी अस्पताल जाएं।',
      call108: '108 आपातकालीन सेवा पर कॉल करें',
    },
    footer: {
      tagline: 'सेहतसाथी एआई — वॉयस फॉर भारत संस्करण · एआई क्लिनिक रिसेप्शनिस्ट',
      poweredBy: 'Murf Falcon TTS · Gemini LLM · Deepgram STT · LiveKit Realtime Voice द्वारा संचालित',
      madeFor: '10 Days of Voice Agents — Day 3 Challenge',
    },
  },
  en: {
    badge: 'VOICE FOR BHARAT',
    roleBadge: 'AI Clinic Receptionist',
    heroHeading: 'Your Clinic. Your Voice. Your Saathi.',
    heroSubheading: 'Talk naturally with SehatSaathi AI to get clinic information, request an appointment, or leave a message for the clinic team.',
    states: {
      ready: {
        title: 'Ready to talk',
        message: 'SehatSaathi AI is ready when you are.',
        cta: 'Start Conversation',
      },
      connecting: {
        title: 'Connecting to SehatSaathi AI...',
        message: 'Please wait while we connect your voice session.',
        cta: 'Connecting...',
      },
      listening: {
        title: 'Listening to you',
        message: "Go ahead, I'm listening.",
        speakerLabel: 'Listening to you',
      },
      speaking: {
        title: 'SehatSaathi is speaking',
        message: "I'm responding to you.",
        speakerLabel: 'SehatSaathi is speaking',
      },
      ended: {
        title: 'Conversation ended',
        message: 'Thank you for talking with SehatSaathi AI.',
        cta: 'Start Again',
        secondaryCta: 'View Clinic Info',
      },
      reconnecting: {
        title: 'Connection interrupted',
        message: "We're trying to reconnect your voice session.",
      },
    },
    errors: {
      micDeniedTitle: 'Microphone access is required',
      micDeniedMessage: 'SehatSaathi AI needs microphone access to hear you. Please allow microphone permission in your browser settings and try again.',
      micInstructions: 'Click the 🔒 lock icon in your browser address bar, set Microphone to Allow, and refresh the page.',
      connectionErrorTitle: "We couldn't connect",
      connectionErrorMessage: 'Something went wrong while connecting to SehatSaathi AI. Please check your internet connection and try again.',
      connectionTimeoutTitle: 'Connection timed out',
      connectionTimeoutMessage: 'Connecting is taking longer than expected. Please check your network and try again.',
      retryBtn: 'Try Again',
    },
    controls: {
      endCall: 'End Conversation',
      sessionDuration: 'Conversation',
      privacyNote: 'Microphone access is used solely for your voice conversation.',
      speakingLive: 'Voice audio reactive',
    },
    transcript: {
      title: 'Live Conversation',
      subtitle: 'Real-time conversation transcript',
      emptyText: 'Start speaking — transcript will appear here.',
      emptySubtext: 'You can speak in English, Hindi, or Hinglish.',
      copyTooltip: 'Copy transcript to clipboard',
      copiedTooltip: 'Copied to clipboard!',
      downloadTooltip: 'Download transcript (.txt)',
      clearTooltip: 'Clear transcript view',
      youLabel: 'You (Caller)',
      assistantLabel: 'SehatSaathi AI (Receptionist)',
      messagesCount: (n: number) => `Live Conversation · ${n} ${n === 1 ? 'message' : 'messages'}`,
      toggleShow: 'Show Live Transcript',
      toggleHide: 'Hide Live Transcript',
    },
    quickActions: {
      heading: 'Quick Voice Actions',
      subheading: 'Try saying any of these to start your conversation:',
      appointment: {
        title: 'Book an Appointment',
        desc: 'Request or reschedule a clinic appointment slot.',
        samplePrompt: '“I would like to request an appointment for a general checkup tomorrow morning.”',
      },
      clinicInfo: {
        title: 'Clinic Information',
        desc: 'Check clinic timings, location, or available services.',
        samplePrompt: '“What are the clinic opening hours and available departments?”',
      },
      doctorMessage: {
        title: 'Leave a Message',
        desc: 'Leave a message for the clinic doctor team.',
        samplePrompt: '“Please take a message for the doctor to arrange a callback.”',
      },
    },
    clinicCard: {
      title: 'Sunrise Family Clinic',
      name: 'Sunrise Family Clinic',
      hoursLabel: 'Clinic Timings',
      hoursValue: 'Monday – Saturday · 9:00 AM – 7:00 PM (Sunday Closed)',
      servicesLabel: 'Available Departments',
      servicesList: ['General Medicine', 'Pediatrics (Child Health)', 'Gynecology (Women Health)'],
      disclaimer: 'Note: Appointment requests and doctor messages are recorded by SehatSaathi AI and confirmed directly by Sunrise Family Clinic staff.',
    },
    requestGuide: {
      title: 'Appointment Request Flow',
      step1: '1. Name',
      step2: '2. Reason for Visit',
      step3: '3. Preferred Date',
      step4: '4. Preferred Time',
      step5: '5. Doctor / Department',
      note: 'SehatSaathi notes your details cleanly. Final slot confirmation is verified by the clinic.',
    },
    trust: {
      title: 'Designed for Bharat',
      item1Title: 'Voice-First Access',
      item1Desc: 'Zero complicated menus or forms — just talk naturally with your clinic.',
      item2Title: 'Multilingual & Hinglish',
      item2Desc: 'Understands English, Hindi, and code-mixed natural spoken Hinglish.',
      item3Title: 'Accurate Clinic Coordination',
      item3Desc: 'Accurately collects requests and messages for verified staff follow-up.',
      item4Title: 'Strict Medical Safety',
      item4Desc: 'No unverified medical advice or fake confirmations. Patient safety first.',
    },
    safety: {
      disclaimerTitle: 'AI Clinic Receptionist Disclaimer',
      disclaimerBody: 'SehatSaathi AI is a virtual clinic receptionist. It does not provide medical diagnosis, treatment advice, prescriptions, or dosage recommendations. For medical concerns, please consult a qualified healthcare professional.',
      emergencyTitle: 'Need urgent medical help?',
      emergencyBody: 'SehatSaathi AI is not an emergency service. If you are experiencing a potentially life-threatening situation (chest pain, severe breathing difficulty, heavy bleeding), seek immediate emergency medical help or call 108.',
      call108: 'Call 108 Emergency Services',
    },
    footer: {
      tagline: 'SehatSaathi AI — Voice for Bharat Edition · AI Clinic Receptionist',
      poweredBy: 'Powered by Murf Falcon TTS · Gemini LLM · Deepgram STT · LiveKit Realtime Voice',
      madeFor: 'Built for 10 Days of Voice Agents — Day 3 Challenge',
    },
  },
  gu: {
    badge: 'VOICE FOR BHARAT',
    roleBadge: 'એઆઈ ક્લિનિક રિસેપ્શનિસ્ટ',
    heroHeading: 'તમારી ક્લિનિક. તમારો અવાજ. તમારો સાથી.',
    heroSubheading: 'ક્લિનિકની માહિતી મેળવવા, એપોઇન્ટમેન્ટની વિનંતી કરવા અથવા ડૉક્ટર માટે સંદેશ આપવા માટે સેહતસાથી એઆઈ સાથે વાત કરો.',
    states: {
      ready: {
        title: 'વાત કરવા માટે તૈયાર',
        message: 'સેહતસાથી એઆઈ તમારી મદદ માટે તૈયાર છે. વાત શરૂ કરો!',
        cta: 'વાતચીત શરૂ કરો',
      },
      connecting: {
        title: 'સેહતસાથી એઆઈ સાથે જોડાઈ રહ્યા છીએ...',
        message: 'કૃપા કરીને રાહ જુઓ, તમારું વૉઇસ સત્ર કનેક્ટ થઈ રહ્યું છે.',
        cta: 'કનેક્ટ થઈ રહ્યું છે...',
      },
      listening: {
        title: 'તમારી વાત સાંભળી રહ્યા છીએ',
        message: 'કૃપા કરીને બોલો, હું સાંભળી રહી છું.',
        speakerLabel: 'તમારી વાત સાંભળી રહ્યા છીએ',
      },
      speaking: {
        title: 'સેહતસાથી બોલી રહી છે',
        message: 'હું તમારો જવાબ આપી રહી છું.',
        speakerLabel: 'સેહતસાથી બોલી રહી છે',
      },
      ended: {
        title: 'વાતચીત સમાપ્ત થઈ',
        message: 'સેહતસાથી એઆઈ સાથે વાત કરવા બદલ આભાર.',
        cta: 'ફરી વાત કરો',
        secondaryCta: 'ક્લિનિક વિગતો જુઓ',
      },
      reconnecting: {
        title: 'કનેક્શન પુનઃસ્થાપિત થઈ રહ્યું છે',
        message: 'કૃપા કરીને લાઇન પર રહો, ફરી જોડવાનો પ્રયાસ કરી રહ્યા છીએ...',
      },
    },
    errors: {
      micDeniedTitle: 'માઇક્રોફોન પરવાનગી જરૂરી છે',
      micDeniedMessage: 'સેહતસાથી એઆઈને તમારો અવાજ સાંભળવા માટે માઇક્રોફોન એક્સેસની જરૂર છે. કૃપા કરીને બ્રાઉઝર સેટિંગ્સમાં પરવાનગી આપો.',
      micInstructions: 'એડ્રેસ બારમાં 🔒 લોક આઇકોન પર ક્લિક કરીને માઇક્રોફોન Allow કરો અને પેજ રિફ્રેશ કરો.',
      connectionErrorTitle: 'કનેક્ટ થઈ શક્યું નથી',
      connectionErrorMessage: 'કનેક્ટ કરતી વખતે સમસ્યા આવી. કૃપા કરીને તમારું ઇન્ટરનેટ કનેક્શન તપાસો.',
      connectionTimeoutTitle: 'કનેક્શન સમયસમાપ્તિ',
      connectionTimeoutMessage: 'કનેક્ટ થવામાં સમય લાગી રહ્યો છે. કૃપા કરીને નેટવર્ક તપાસો.',
      retryBtn: 'ફરી પ્રયાસ કરો',
    },
    controls: {
      endCall: 'વાતચીત સમાપ્ત કરો',
      sessionDuration: 'કૉલ સમયગાળો',
      privacyNote: 'માઇક્રોફોનનો ઉપયોગ ફક્ત તમારી લાઇવ વાતચીત માટે થાય છે.',
      speakingLive: 'ઑડિઓ સક્રિય',
    },
    transcript: {
      title: 'લાઇવ વાતચીત',
      subtitle: 'રિયલ-ટાઇમ વાતચીત ટ્રાન્સક્રિપ્ટ',
      emptyText: 'બોલવાનું શરૂ કરો — ટ્રાન્સક્રિપ્ટ અહીં દેખાશે.',
      emptySubtext: 'તમે ગુજરાતી, હિન્દી કે અંગ્રેજીમાં બોલી શકો છો.',
      copyTooltip: 'ટ્રાન્સક્રિપ્ટ કૉપિ કરો',
      copiedTooltip: 'કૉપિ થઈ ગયું!',
      downloadTooltip: 'ટ્રાન્સક્રિપ્ટ ડાઉનલોડ કરો (.txt)',
      clearTooltip: 'ટ્રાન્સક્રિપ્ટ સાફ કરો',
      youLabel: 'તમે (કૉલર)',
      assistantLabel: 'સેહતસાથી એઆઈ (રિસેપ્શનિસ્ટ)',
      messagesCount: (n: number) => `લાઇવ વાતચીત · ${n} સંદેશ`,
      toggleShow: 'ટ્રાન્સક્રિપ્ટ બતાવો',
      toggleHide: 'ટ્રાન્સક્રિપ્ટ છુપાવો',
    },
    quickActions: {
      heading: 'ઝડપી વૉઇસ વિકલ્પો',
      subheading: 'વાતચીત શરૂ કરવા માટે આમાંથી કંઈપણ બોલો:',
      appointment: {
        title: 'એપોઇન્ટમેન્ટ બુક કરો',
        desc: 'ક્લિનિક સ્લોટની વિનંતી કરો અથવા સમય બદલો.',
        samplePrompt: '“મને કાલે સવારે જનરલ ચેકઅપ માટે એપોઇન્ટમેન્ટ જોઈએ છે.”',
      },
      clinicInfo: {
        title: 'ક્લિનિકની માહિતી',
        desc: 'ક્લિનિકનો સમય અને ઉપલબ્ધ વિભાગો જાણો.',
        samplePrompt: '“ક્લિનિક ખુલવાનો સમય અને સેવાઓ શું છે?”',
      },
      doctorMessage: {
        title: 'ડૉક્ટર માટે સંદેશ',
        desc: 'ક્લિનિક ટીમને સંદેશો આપો.',
        samplePrompt: '“ડૉક્ટર માટે કૉલબેક સંદેશ નોંધી લો.”',
      },
    },
    clinicCard: {
      title: 'સનરાઇઝ ફેમિલી ક્લિનિક',
      name: 'સનરાઇઝ ફેમિલી ક્લિનિક',
      hoursLabel: 'ક્લિનિકનો સમય',
      hoursValue: 'સોમવાર – શનિવાર · સવારે 9:00 થી સાંજે 7:00 (રવિવાર બંધ)',
      servicesLabel: 'ઉપલબ્ધ વિભાગો',
      servicesList: ['જનરલ મેડિસિન', 'બાળ રોગ (પીડિયાટ્રિક્સ)', 'સ્ત્રી રોગ (ગાયનેકોલોજી)'],
      disclaimer: 'સૂચના: એપોઇન્ટમેન્ટ વિનંતીઓ સેહતસાથી એઆઈ દ્વારા નોંધવામાં આવે છે અને ક્લિનિક સ્ટાફ દ્વારા પુષ્ટિ થાય છે.',
    },
    requestGuide: {
      title: 'એપોઇન્ટમેન્ટ પ્રક્રિયા',
      step1: '1. નામ',
      step2: '2. મુલાકાતનું કારણ',
      step3: '3. તારીખ',
      step4: '4. સમય',
      step5: '5. ડૉક્ટર / વિભાગ',
      note: 'સેહતસાથી તમારી વિગતો નોંધે છે. અંતિમ પુષ્ટિ ક્લિનિક સ્ટાફ દ્વારા થાય છે.',
    },
    trust: {
      title: 'ભારત માટે ખાસ ડિઝાઇન કરેલ',
      item1Title: 'વૉઇસ-પ્રથમ ઍક્સેસ',
      item1Desc: 'કોઈ જટિલ ફોર્મ વગર — સરળતાથી તમારી ભાષામાં વાત કરો.',
      item2Title: 'બહુભાષી સુવિધા',
      item2Desc: 'ગુજરાતી, હિન્દી અને અંગ્રેજી ભાષા સહજ રીતે સમજે છે.',
      item3Title: 'ચોક્કસ ક્લિનિક સમન્વય',
      item3Desc: 'ક્લિનિક ટીમ માટે સચોટ માહિતી રેકોર્ડ કરે છે.',
      item4Title: 'તબીબી સુરક્ષાનું પાલન',
      item4Desc: 'કોઈ ખોટી તબીબી સલાહ નહીં. દર્દીની સુરક્ષા સર્વોપરી.',
    },
    safety: {
      disclaimerTitle: 'એઆઈ ક્લિનિક રિસેપ્શનિસ્ટ ડિસ્ક્લેમર',
      disclaimerBody: 'સેહતસાથી એઆઈ એક વર્ચ્યુઅલ ક્લિનિક રિસેપ્શનિસ્ટ છે. તે કોઈ રોગનિદાન, સારવાર સલાહ અથવા દવાઓની ભલામણ કરતી નથી. તબીબી સલાહ માટે કૃપા કરીને યોગ્ય ડૉક્ટરનો સંપર્ક કરો.',
      emergencyTitle: 'ઇમરજન્સી સહાયની જરૂર છે?',
      emergencyBody: 'સેહતસાથી એઆઈ કટોકટી સેવા નથી. છાતીમાં દુખાવો કે શ્વાસ લેવામાં ગંભીર તકલીફ હોય તો કૃપા કરીને તરત 108 પર કૉલ કરો અથવા નજીકની હોસ્પિટલ પહોંચો.',
      call108: '108 ઇમરજન્સી સેવા પર કૉલ કરો',
    },
    footer: {
      tagline: 'સેહતસાથી એઆઈ — વૉઇસ ફોર ભારત એડિશન · એઆઈ ક્લિનિક રિસેપ્શનિસ્ટ',
      poweredBy: 'Murf Falcon TTS · Gemini LLM · Deepgram STT · LiveKit Realtime Voice દ્વારા સંચાલિત',
      madeFor: 'Built for 10 Days of Voice Agents — Day 3 Challenge',
    },
  },
};
