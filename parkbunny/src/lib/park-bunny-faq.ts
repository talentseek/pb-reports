/**
 * Park Bunny FAQ Knowledge Base
 * 49 questions across 11 categories — used by the VAPI customer support assistant
 * and the dashboard support analytics page.
 */

export interface FAQEntry {
  question: string
  answer: string
}

export interface FAQCategory {
  name: string
  entries: FAQEntry[]
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    name: 'Getting Started',
    entries: [
      {
        question: 'How do I park using the Park Bunny app?',
        answer:
          'Download the Park Bunny app from the Apple App Store or Google Play Store, register with your name and email address, verify your email using the validation link sent. You must click on the link in the email to use your Park Bunny account. Add your vehicle details, select your location, and start your parking session.',
      },
      {
        question: 'Can I use the app before verifying my email address?',
        answer: 'No. You should verify your email address before using the app to pay for parking.',
      },
      {
        question: "Why haven't I received my validation email?",
        answer:
          'Check your junk or spam folder and confirm that the correct email address is entered in your account settings.',
      },
      {
        question: 'What happens if I try to register but cannot verify my email and leave the car park?',
        answer:
          'If you leave without parking and exit within around 15 minutes, you should normally not receive a parking charge.',
      },
    ],
  },
  {
    name: 'Finding a Car Park',
    entries: [
      {
        question: 'What is a location code and how do I find it?',
        answer:
          'A location code is the unique number linked to a parking space, meter, or car park. It is used so enforcement operators can confirm that your parking session is valid. It is numeric only, with no letters or special characters, and is shown on-site on Park Bunny signs or meters. You can also find locations using the map feature, nearby locations, recent locations, or favourites.',
      },
      {
        question: 'How do I find an available parking spot?',
        answer: 'Use the map feature in the app to find available parking near you.',
      },
      {
        question: "How can enforcement operators tell that I've paid?",
        answer:
          'Enforcement operators use attendants and ANPR camera systems to check the location code and vehicle registration. You do not need to display anything on your dashboard.',
      },
    ],
  },
  {
    name: 'Parking Sessions',
    entries: [
      {
        question: 'How do I know if my parking session is confirmed?',
        answer:
          'If your session appears in the Sessions section of the app, it has been confirmed. You should also receive a confirmation email.',
      },
      {
        question: 'When does my parking session start?',
        answer: 'Your parking session starts as soon as payment is successfully completed.',
      },
      {
        question: 'Can I extend my parking session?',
        answer:
          'Yes, up to the maximum allowed time for that location, but you must extend before your current session expires.',
      },
      {
        question: "Why couldn't I extend my session?",
        answer:
          'Sessions must be extended before expiry. If your original session has already ended, you will need to start a new one.',
      },
      {
        question: 'Can I leave the car park and return during an active session?',
        answer:
          'This depends on the rules of that specific site. Park Bunny does not enforce parking rules, so you should check the signage or contact the enforcement operator.',
      },
      {
        question: 'What happens if I overstay?',
        answer:
          'Any additional charges or consequences depend on the tariff and car park rules shown on the signage.',
      },
      {
        question: 'Is the parking rate hourly or daily?',
        answer:
          'Some locations offer hourly rates, some daily rates, and some both. Check the pricing shown in the app for that location.',
      },
    ],
  },
  {
    name: 'Payment Timing and Grace Periods',
    entries: [
      {
        question: 'How long do I have to pay after arriving?',
        answer:
          'At many camera-controlled sites, there is a grace period of up to 15 minutes to either pay for parking or leave the car park.',
      },
      {
        question: 'Do I need to pay if I enter and leave shortly after?',
        answer:
          'If you enter and exit within about 15 minutes without parking or leaving the site on foot, you would normally not need to pay.',
      },
      {
        question: 'Is it okay if I paid when leaving instead of when I arrived?',
        answer:
          'In many camera-controlled car parks, if you paid before leaving and your payment covered the full duration of your stay, this is generally acceptable. Enforcement decisions are still made by the parking operator.',
      },
      {
        question: 'What should I do if I forgot to pay immediately but paid before leaving?',
        answer:
          'If you paid before leaving and covered the full duration of stay, this should generally not be a problem at camera-controlled locations. If a PCN is issued, appeal to the operator with proof of payment.',
      },
      {
        question: "What should I do if I couldn't pay using the app?",
        answer:
          'There should normally be another payment method, such as a pay-and-display machine. If you are unable to pay by any available method, you should leave the car park as soon as possible and find another place to park. Where ANPR enforcement is used, a grace period of about 15 minutes may apply.',
      },
      {
        question: "The pay-and-display machine wasn't working and I couldn't use the app. What should I do?",
        answer:
          'You must comply with the car park terms and conditions. If you cannot pay by any available method, you should leave the car park as soon as possible.',
      },
    ],
  },
  {
    name: 'Pre-Booking and Pre-Payment',
    entries: [
      {
        question: 'Can I pre-book parking?',
        answer:
          'Most Park Bunny locations do not support pre-booking because many are open or free-flow sites where spaces cannot be guaranteed.',
      },
      {
        question: 'Can I pay in advance before arriving?',
        answer: 'Yes, but the session starts when payment succeeds, not when you arrive.',
      },
    ],
  },
  {
    name: 'Payments, Fees and Receipts',
    entries: [
      {
        question: "Why can't I pay for my parking session?",
        answer:
          'Check that your email is verified, your payment details are correct, your connection is stable, and the app is up to date.',
      },
      {
        question: 'My payment failed but the money is showing as pending in my bank. What does this mean?',
        answer:
          'If the payment failed or was declined, your parking session was not successful. The money is usually being held by your bank temporarily and is normally released back within 2 to 3 working days, depending on your bank.',
      },
      {
        question: 'Why does Park Bunny charge a transaction or service fee?',
        answer:
          'The fee helps cover the cost of running the platform and providing the service. It may also cover features not available at a meter, such as email receipts, in-app notifications, and geolocation services.',
      },
      {
        question: 'Is VAT applied to the transaction fee, and can I claim it back?',
        answer:
          'Yes. Your receipt provides a breakdown, and VAT on the transaction fee can be claimed back where applicable.',
      },
      {
        question: 'Why is the amount charged different from the displayed tariff?',
        answer:
          'Possible reasons include the convenience or transaction fee, special event pricing, operator pricing rules, or other clearly displayed additional charges shown in the app before payment.',
      },
      {
        question: 'How do I get a VAT receipt?',
        answer:
          'VAT receipts are automatically emailed to the address linked to your account after payment.',
      },
      {
        question: 'Is my payment information secure?',
        answer:
          'Yes. Park Bunny uses industry-standard encryption, and payment details are processed by payment providers rather than being held directly by Park Bunny.',
      },
    ],
  },
  {
    name: 'Refunds and Changes',
    entries: [
      {
        question: 'Can I get a refund if I leave early?',
        answer:
          'Parking payments are generally non-refundable if you leave earlier than expected.',
      },
      {
        question: 'Can I reduce the parking fee if I leave early?',
        answer:
          'No. On standard pay-on-entry sites, it is usually better to pay for the minimum time you need and extend if required.',
      },
      {
        question: 'How do I get a refund?',
        answer:
          'Park Bunny only processes payments and directs funds to the landowner or operator, so refunds are generally not handled by Park Bunny.',
      },
      {
        question: 'I bought a session for the wrong car park. What should I do?',
        answer:
          'You cannot change the location for an active parking session. You should purchase another session for the correct car park and double-check the location, vehicle, rate, and expiry before confirming in future.',
      },
      {
        question: 'I bought a session for the wrong vehicle. What should I do?',
        answer:
          'You cannot change the vehicle registration for an active session. You should purchase another session for the correct vehicle and double-check the details before confirming.',
      },
      {
        question: 'Can I change the start time of my parking session after it has started?',
        answer: 'No. Once a session has started, the start time cannot be edited.',
      },
    ],
  },
  {
    name: 'Vehicle Details',
    entries: [
      {
        question: 'What should I do if I entered the wrong number plate?',
        answer:
          'If the session has already been paid for, Park Bunny cannot change the registration. This is usually treated as a mis-keying incident, and you should contact the car park management company or enforcement operator.',
      },
      {
        question: 'What if it was only a small typo?',
        answer:
          'Minor keying errors may be treated more leniently by the enforcement company, but you may still need to appeal formally.',
      },
      {
        question: 'My vehicle details are incorrect. How do I update them?',
        answer:
          'The important detail is the vehicle registration used for the parking session. If the registration is correct, the booking should still be valid even if the make or model is out of date, because enforcement checks the registration only.',
      },
      {
        question: "Why won't the app let me start a session for my vehicle?",
        answer:
          'Some locations only have tariffs for certain vehicle types, such as cars. If your vehicle is registered as a van, payment may fail if no matching tariff exists.',
      },
    ],
  },
  {
    name: 'Parking Charges, PCNs and Appeals',
    entries: [
      {
        question: 'Does Park Bunny issue parking fines or PCNs?',
        answer:
          'No. Park Bunny does not issue parking charges or penalty charges. They are issued by the enforcement company managing the site.',
      },
      {
        question: 'What should I do if I receive a parking charge or penalty charge?',
        answer:
          'First check whether you complied with the car park rules: right location, full duration paid, correct vehicle registration, stayed within bay markings, and exited before expiry. If you still believe it was issued incorrectly, appeal directly to the enforcement company using the details on the notice.',
      },
      {
        question: 'Can Park Bunny cancel or appeal a PCN for me?',
        answer:
          'No. Park Bunny cannot intervene beyond providing details of the parking session you purchased.',
      },
      {
        question: 'What if my appeal is rejected?',
        answer:
          'If it was a private parking charge, you may be able to appeal to POPLA or IAS, depending on which trade body the enforcement company belongs to. If it is a local authority penalty charge, those services do not apply.',
      },
      {
        question: 'I threw away the parking fine letter. Can Park Bunny resend it?',
        answer:
          'No. Park Bunny does not issue fines or PCNs. You need to contact the enforcement company listed on the car park signs.',
      },
      {
        question: 'Who do I complain to or what other action can I take?',
        answer:
          'Private parking companies are generally regulated by either the British Parking Association or the International Parking Community. Those bodies have complaints procedures for their members.',
      },
    ],
  },
  {
    name: 'Breakdowns and Exceptional Situations',
    entries: [
      {
        question: 'My vehicle has broken down in a car park. What should I do?',
        answer:
          'Make sure you have an active parking session covering your stay to reduce the risk of an unwanted charge, then contact a breakdown company for assistance.',
      },
    ],
  },
  {
    name: 'Devices and Support',
    entries: [
      {
        question: "Why can't I download the Park Bunny app?",
        answer:
          'The app requires a supported device and operating system because it processes secure payments.',
      },
      {
        question: 'What devices are supported?',
        answer:
          'Park Bunny supports current manufacturer-supported devices and operating systems. Older devices may show as incompatible.',
      },
      {
        question: "I've got a problem. Who do I contact?",
        answer:
          "If the issue is with the app, contact Park Bunny support by email. If the issue is with the pay-and-display machine or the car park itself, use the operator contact details shown on the signage or in the car park details in the app.",
      },
    ],
  },
]

/**
 * Build a formatted FAQ string for embedding in a VAPI system prompt.
 */
export function buildFAQPromptBlock(): string {
  return FAQ_CATEGORIES.map((cat) => {
    const entries = cat.entries
      .map((e) => `Q: ${e.question}\nA: ${e.answer}`)
      .join('\n\n')
    return `## ${cat.name}\n\n${entries}`
  }).join('\n\n---\n\n')
}

/**
 * Total count of FAQ entries.
 */
export const FAQ_TOTAL = FAQ_CATEGORIES.reduce((sum, cat) => sum + cat.entries.length, 0)

/**
 * Flat list of all category names.
 */
export const FAQ_CATEGORY_NAMES = FAQ_CATEGORIES.map((c) => c.name)
