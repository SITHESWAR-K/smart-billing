import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

const translations = {
  en: {
    // Home page
    smartBilling: 'GrociBill',
    tagline: 'Voice-Enabled Secure Billing for Your Shop',
    voiceToText: 'Voice to Text',
    pinVoiceAuth: 'PIN + Voice Auth',
    dailySecurityCodes: 'Daily Security Codes',
    newShop: 'New Shop?',
    newShopDesc: 'Register your shop and become the main shopkeeper in 2 simple steps',
    registerShop: 'Register Shop',
    alreadyRegistered: 'Already Registered?',
    alreadyRegisteredDesc: 'Login with your Shop ID and 4-digit PIN',
    login: 'Login',

    // How It Works
    howItWorks: 'How It Works',
    step1Title: 'Register Shop',
    step1Desc: 'Create your shop account and set a secure PIN',
    step2Title: 'Voice Verification',
    step2Desc: 'Login and read daily code to verify your voice',
    step3Title: 'Start Voice Billing',
    step3Desc: 'Tap mic and speak item name and price',
    step4Title: 'Auto Bill Generation',
    step4Desc: 'Items are added and bill is created instantly',
    step5Title: 'Share / Print',
    step5Desc: 'Send bill via WhatsApp or print',

    // Key Features
    keyFeatures: 'Key Features',
    feature1Title: 'Voice Billing',
    feature1Desc: 'Speak product name and create bill instantly',
    feature2Title: 'Voice Price Update',
    feature2Desc: 'Update prices using voice — no manual work',
    feature3Title: 'Secure Access',
    feature3Desc: 'Only registered shopkeepers can do billing',
    feature4Title: 'Fast Billing',
    feature4Desc: 'Generate bills quickly with simple voice input',
    feature5Title: 'Clean Bills',
    feature5Desc: 'Get clear and neat bills for customers',
    feature6Title: 'Add Products by Voice',
    feature6Desc: 'Easily add new items using voice',
    feature7Title: 'Smart Reports',
    feature7Desc: 'View daily, weekly, monthly and item-wise reports',
    feature8Title: 'Low Stock Alerts',
    feature8Desc: 'Get alerts when products are running low',

    // Login page
    welcomeBack: 'Welcome Back!',
    enterShopId: 'Enter your Shop ID to login',
    shopId: 'Shop ID',
    pasteShopId: 'Paste your Shop ID here',
    continue: 'Continue',
    checking: 'Checking...',
    shopNotFound: 'Shop not found. Please check your Shop ID.',
    selectRole: 'Select Your Role',
    whoAreYou: 'Who are you?',
    mainShopkeeper: 'Main Shopkeeper',
    fullAccess: 'Full access to all features',
    alternativeShopkeeper: 'Alternative Shopkeeper',
    billingAccessOnly: 'Billing access only',
    back: 'Back',
    enterPin: 'Enter your 4-digit PIN',
    verifying: 'Verifying...',
    wrongPin: 'Wrong PIN. Please try again.',
    newHere: 'New here?',
    registerAShop: 'Register a shop',
    backToHome: 'Back to Home',

    // Register page
    registerYourShop: 'Register Your Shop',
    createNewShop: 'Create a new shop and become the main shopkeeper',
    shopName: 'Shop Name',
    shopNamePlaceholder: 'e.g., Kumar Grocery Store',
    yourName: 'Your Name',
    yourNamePlaceholder: 'e.g., Ravi Kumar',
    location: 'Location',
    locationPlaceholder: 'e.g., Chennai, Tamil Nadu',
    nextSetPin: 'Next: Set Your PIN',
    setYourPin: 'Set Your PIN',
    createPinFor: 'Create a 4-digit PIN for',
    creatingShop: 'Creating your shop...',
    backToDetails: 'Back to details',
    shopCreated: 'Shop Created!',
    shopReady: 'Your shop is ready. Save your Shop ID:',
    yourShopId: 'Your Shop ID',
    copied: 'Copied!',
    important: 'Important!',
    saveShopId: 'Save this Shop ID! You\'ll need it to login and to add alternative shopkeepers.',
    goToDashboard: 'Go to Dashboard',
    alreadyHaveShop: 'Already have a shop?',
    signIn: 'Sign in',

    // Dashboard
    dashboard: 'Dashboard',
    welcomeBackName: 'Welcome back,',
    accountInfo: 'Account Info',
    shopIdLabel: 'Shop ID',
    shopNameLabel: 'Shop Name',
    roleLabel: 'Role',
    manageProducts: 'Manage Products',
    manageProductsDesc: 'Add, edit, or remove products from your inventory',
    goToProducts: 'Go to Products',
    createBill: 'Create Bill',
    createBillDesc: 'Create a new bill with dual verification',
    newBill: 'New Bill',
    viewAllBills: 'View All Bills',
    viewBillsDesc: 'View history of all bills created',
    viewBills: 'View Bills',
    reports: 'Reports',
    reportsDesc: 'Track daily, monthly, and yearly performance',
    viewReports: 'View Reports',
    addAlternativeShopkeeper: 'Add Alternative Shopkeeper',
    addAltShopkeeperDesc: 'Add another shopkeeper who can do billing',
    addShopkeeper: 'Add Shopkeeper',

    // Navbar
    products: 'Products',
    billing: 'Billing',
    refresh: 'Refresh',
    logout: 'Logout',

    // Billing page
    voiceBilling: 'Voice Billing',
    stopVoice: 'Stop Voice',
    listening: 'Listening... Say product names!',
    sayProductNames: 'Say product names like "Rice", "Sugar", "Amul Butter"',
    added: 'Added',
    productsLabel: 'Products',
    searchProducts: 'Search products...',
    noProducts: 'No products available. Add products first.',
    noMatchingProducts: 'No matching products found.',
    billSummary: 'Bill Summary',
    noItemsAdded: 'No items added yet',
    clickOrVoice: 'Click products or use voice to add',
    items: 'Items',
    total: 'Total',
    processing: 'Processing...',
    createBillBtn: 'Create Bill',
    cancel: 'Cancel',

    // Bills page
    allBills: 'All Bills',
    loadingBills: 'Loading bills...',
    noBillsCreated: 'No bills created yet',
    billNumber: 'Bill #',
    date: 'Date',
    shopkeeper: 'Shopkeeper',

    // Language toggle
    english: 'English',
    tamil: 'தமிழ்'
  },
  ta: {
    // Home page
    smartBilling: 'GrociBill',
    tagline: 'உங்கள் கடைக்கான குரல்-இயக்கப்பட்ட பாதுகாப்பான பில்லிங்',
    voiceToText: 'குரல் உரையாக',
    pinVoiceAuth: 'PIN + குரல் அங்கீகாரம்',
    dailySecurityCodes: 'தினசரி பாதுகாப்பு குறியீடுகள்',
    newShop: 'புதிய கடையா?',
    newShopDesc: '2 எளிய படிகளில் உங்கள் கடையை பதிவு செய்து முதன்மை கடைக்காரராக மாறுங்கள்',
    registerShop: 'கடை பதிவு',
    alreadyRegistered: 'ஏற்கனவே பதிவு செய்துள்ளீர்களா?',
    alreadyRegisteredDesc: 'உங்கள் கடை ID மற்றும் 4-இலக்க PIN உடன் உள்நுழையவும்',
    login: 'உள்நுழை',

    // How It Works
    howItWorks: 'இது எப்படி வேலை செய்கிறது',
    step1Title: 'கடை பதிவு',
    step1Desc: 'உங்கள் கடை கணக்கை உருவாக்கி பாதுகாப்பான PIN அமைக்கவும்',
    step2Title: 'குரல் சரிபார்ப்பு',
    step2Desc: 'உள்நுழைந்து உங்கள் குரலை சரிபார்க்க தினசரி குறியீட்டை படிக்கவும்',
    step3Title: 'குரல் பில்லிங் தொடங்கு',
    step3Desc: 'மைக்கை தட்டி பொருள் பெயர் மற்றும் விலையை பேசுங்கள்',
    step4Title: 'தானியங்கி பில் உருவாக்கம்',
    step4Desc: 'பொருட்கள் சேர்க்கப்பட்டு பில் உடனடியாக உருவாக்கப்படும்',
    step5Title: 'பகிர் / அச்சிடு',
    step5Desc: 'WhatsApp வழியாக பில் அனுப்பு அல்லது அச்சிடு',

    // Key Features
    keyFeatures: 'முக்கிய அம்சங்கள்',
    feature1Title: 'குரல் பில்லிங்',
    feature1Desc: 'பொருள் பெயரை பேசி உடனடியாக பில் உருவாக்கு',
    feature2Title: 'குரல் விலை புதுப்பிப்பு',
    feature2Desc: 'குரல் பயன்படுத்தி விலைகளை புதுப்பிக்கவும் — கைமுறை வேலை இல்லை',
    feature3Title: 'பாதுகாப்பான அணுகல்',
    feature3Desc: 'பதிவுசெய்த கடைக்காரர்கள் மட்டுமே பில்லிங் செய்ய முடியும்',
    feature4Title: 'வேகமான பில்லிங்',
    feature4Desc: 'எளிய குரல் உள்ளீட்டுடன் விரைவாக பில்கள் உருவாக்கு',
    feature5Title: 'தெளிவான பில்கள்',
    feature5Desc: 'வாடிக்கையாளர்களுக்கு தெளிவான மற்றும் சுத்தமான பில்கள் பெறுங்கள்',
    feature6Title: 'குரல் மூலம் பொருட்கள் சேர்',
    feature6Desc: 'குரல் பயன்படுத்தி எளிதாக புதிய பொருட்களை சேர்க்கவும்',
    feature7Title: 'ஸ்மார்ட் அறிக்கைகள்',
    feature7Desc: 'தினசரி, வாராந்திர, மாதாந்திர மற்றும் பொருள்வாரியான அறிக்கைகளைப் பார்க்கவும்',
    feature8Title: 'குறைந்த கையிருப்பு எச்சரிக்கைகள்',
    feature8Desc: 'பொருட்கள் குறைவாக இருக்கும்போது எச்சரிக்கைகள் பெறுங்கள்',

    // Login page
    welcomeBack: 'மீண்டும் வரவேற்கிறோம்!',
    enterShopId: 'உள்நுழைய உங்கள் கடை ID ஐ உள்ளிடவும்',
    shopId: 'கடை ID',
    pasteShopId: 'உங்கள் கடை ID ஐ இங்கே ஒட்டவும்',
    continue: 'தொடர்க',
    checking: 'சரிபார்க்கிறது...',
    shopNotFound: 'கடை கிடைக்கவில்லை. உங்கள் கடை ID ஐ சரிபார்க்கவும்.',
    selectRole: 'உங்கள் பங்கை தேர்வு செய்யவும்',
    whoAreYou: 'நீங்கள் யார்?',
    mainShopkeeper: 'முதன்மை கடைக்காரர்',
    fullAccess: 'அனைத்து அம்சங்களுக்கும் முழு அணுகல்',
    alternativeShopkeeper: 'மாற்று கடைக்காரர்',
    billingAccessOnly: 'பில்லிங் அணுகல் மட்டும்',
    back: 'பின்செல்',
    enterPin: 'உங்கள் 4-இலக்க PIN ஐ உள்ளிடவும்',
    verifying: 'சரிபார்க்கிறது...',
    wrongPin: 'தவறான PIN. மீண்டும் முயற்சிக்கவும்.',
    newHere: 'புதியவரா?',
    registerAShop: 'கடையை பதிவு செய்யவும்',
    backToHome: 'முகப்புக்கு திரும்பு',

    // Register page
    registerYourShop: 'உங்கள் கடையை பதிவு செய்யவும்',
    createNewShop: 'புதிய கடையை உருவாக்கி முதன்மை கடைக்காரராக மாறுங்கள்',
    shopName: 'கடை பெயர்',
    shopNamePlaceholder: 'எ.கா., குமார் மளிகை கடை',
    yourName: 'உங்கள் பெயர்',
    yourNamePlaceholder: 'எ.கா., ரவி குமார்',
    location: 'இடம்',
    locationPlaceholder: 'எ.கா., சென்னை, தமிழ்நாடு',
    nextSetPin: 'அடுத்து: உங்கள் PIN அமைக்கவும்',
    setYourPin: 'உங்கள் PIN அமைக்கவும்',
    createPinFor: '4-இலக்க PIN உருவாக்கவும்',
    creatingShop: 'உங்கள் கடையை உருவாக்குகிறது...',
    backToDetails: 'விவரங்களுக்கு திரும்பு',
    shopCreated: 'கடை உருவாக்கப்பட்டது!',
    shopReady: 'உங்கள் கடை தயார். உங்கள் கடை ID ஐ சேமிக்கவும்:',
    yourShopId: 'உங்கள் கடை ID',
    copied: 'நகலெடுக்கப்பட்டது!',
    important: 'முக்கியம்!',
    saveShopId: 'இந்த கடை ID ஐ சேமிக்கவும்! உள்நுழைவதற்கும் மாற்று கடைக்காரர்களை சேர்ப்பதற்கும் இது தேவை.',
    goToDashboard: 'டாஷ்போர்டுக்கு செல்',
    alreadyHaveShop: 'ஏற்கனவே கடை உள்ளதா?',
    signIn: 'உள்நுழை',

    // Dashboard
    dashboard: 'டாஷ்போர்டு',
    welcomeBackName: 'மீண்டும் வரவேற்கிறோம்,',
    accountInfo: 'கணக்கு தகவல்',
    shopIdLabel: 'கடை ID',
    shopNameLabel: 'கடை பெயர்',
    roleLabel: 'பங்கு',
    manageProducts: 'பொருட்களை நிர்வகி',
    manageProductsDesc: 'உங்கள் சரக்கிலிருந்து பொருட்களை சேர்க்கவும், திருத்தவும் அல்லது அகற்றவும்',
    goToProducts: 'பொருட்களுக்கு செல்',
    createBill: 'பில் உருவாக்கு',
    createBillDesc: 'இரட்டை சரிபார்ப்புடன் புதிய பில் உருவாக்கு',
    newBill: 'புதிய பில்',
    viewAllBills: 'அனைத்து பில்களையும் பார்',
    viewBillsDesc: 'உருவாக்கப்பட்ட அனைத்து பில்களின் வரலாற்றைப் பார்க்கவும்',
    viewBills: 'பில்களைப் பார்',
    reports: 'அறிக்கைகள்',
    reportsDesc: 'தினசரி, மாதாந்திர, வருடாந்திர செயல்திறனை கண்காணிக்கவும்',
    viewReports: 'அறிக்கைகளைப் பார்',
    addAlternativeShopkeeper: 'மாற்று கடைக்காரர் சேர்',
    addAltShopkeeperDesc: 'பில்லிங் செய்யக்கூடிய மற்றொரு கடைக்காரரை சேர்க்கவும்',
    addShopkeeper: 'கடைக்காரர் சேர்',

    // Navbar
    products: 'பொருட்கள்',
    billing: 'பில்லிங்',
    refresh: 'புதுப்பிக்கவும்',
    logout: 'வெளியேறு',

    // Billing page
    voiceBilling: 'குரல் பில்லிங்',
    stopVoice: 'குரலை நிறுத்து',
    listening: 'கேட்கிறது... பொருள் பெயர்களை சொல்லுங்கள்!',
    sayProductNames: '"அரிசி", "சர்க்கரை" போன்ற பொருள் பெயர்களை சொல்லுங்கள்',
    added: 'சேர்க்கப்பட்டது',
    productsLabel: 'பொருட்கள்',
    searchProducts: 'பொருட்களைத் தேடு...',
    noProducts: 'பொருட்கள் இல்லை. முதலில் பொருட்களைச் சேர்க்கவும்.',
    noMatchingProducts: 'பொருந்தும் பொருட்கள் இல்லை.',
    billSummary: 'பில் சுருக்கம்',
    noItemsAdded: 'இன்னும் பொருட்கள் சேர்க்கப்படவில்லை',
    clickOrVoice: 'சேர்க்க பொருட்களை கிளிக் செய்யவும் அல்லது குரலைப் பயன்படுத்தவும்',
    items: 'பொருட்கள்',
    total: 'மொத்தம்',
    processing: 'செயலாக்குகிறது...',
    createBillBtn: 'பில் உருவாக்கு',
    cancel: 'ரத்து செய்',

    // Bills page
    allBills: 'அனைத்து பில்கள்',
    loadingBills: 'பில்களை ஏற்றுகிறது...',
    noBillsCreated: 'இன்னும் பில்கள் உருவாக்கப்படவில்லை',
    billNumber: 'பில் #',
    date: 'தேதி',
    shopkeeper: 'கடைக்காரர்',

    // Language toggle
    english: 'English',
    tamil: 'தமிழ்'
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language')
    return saved || 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key) => {
    return translations[language][key] || key
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ta' : 'en')
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
