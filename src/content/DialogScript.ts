import { DialogueLine } from '../systems/DialogueSystem';

export const DialogScript = {
  // Cabin - Game Start (enhanced)
  cabinStart: [
    {
      speaker: 'June',
      text: "Ugh… morning already? My stomach's growling louder than the wind outside."
    },
    {
      speaker: 'June',
      text: "Tony? TONY! Where is that guy? He better not be out chopping wood in this weather."
    },
    {
      speaker: 'June',
      text: "*sigh* Guess I'm going out there. If I freeze to death, I'm haunting him."
    }
  ] as DialogueLine[],
  
  // First meeting with Gabi (enhanced)
  meetGabi: [
    {
      speaker: 'Gabi',
      text: "Oh! Forgive me, child. I… I seem to be terribly lost."
    },
    {
      speaker: 'June',
      text: "Lost? You picked a great spot for it—middle of nowhere, freezing cold. Five stars."
    },
    {
      speaker: 'Gabi',
      text: "I wish I could explain, but I… I can't remember. My name, my purpose… it's all fog."
    },
    {
      speaker: 'June',
      text: "Amnesia? In a mysterious forest? This is either a very weird dream or my life just got interesting."
    },
    {
      speaker: 'Gabi',
      text: "These symbols… I feel drawn to them. Ancient texts might hold answers."
    },
    {
      speaker: 'June',
      text: "Ancient texts? You mean like... in a library?"
    },
    {
      speaker: 'Gabi',
      text: "Yes! A library. Do you know of such a place nearby?"
    },
    {
      speaker: 'June',
      text: "I do, actually! But... ugh, where did I leave my keys?"
    }
  ] as DialogueLine[],

  // West Woods: Tony encounter -> bear snatch
  tonyFoundWoods: [
    { speaker: 'Tony', text: 'June! Hey—sorry. I know I vanished.' },
    { speaker: 'June', text: '“Vanished” is a cute way to say “gave me a panic attack.”' },
    { speaker: 'Tony', text: 'I was chopping a small tree. For the cabin. Christmas stuff.' },
    { speaker: 'June', text: 'You went into haunted woods for interior decorating. Amazing.' },
    { speaker: 'Tony', text: 'Listen… something felt off. Like the forest was… listening.' },
    { speaker: 'June', text: 'Yeah. That’s the vibe. That’s the whole vibe.' }
  ] as DialogueLine[],

  tonyBearSnatch: [
    { speaker: 'Tony', text: 'Did you hear that?' },
    { speaker: 'June', text: 'Please tell me that was… wind?' },
    { speaker: 'Tony', text: 'June—RUN!' }
  ] as DialogueLine[],

  // Underground cage: emotional conversation + sword appears
  tonyInCage: [
    { speaker: 'June', text: 'Tony! Oh my God—are you okay?' },
    { speaker: 'Tony', text: 'Physically? Yeah. Mentally? …I feel stupid.' },
    { speaker: 'June', text: 'Nope. Not allowed. Not today.' },
    { speaker: 'Tony', text: 'I thought I could handle one simple thing. A tree. A surprise.' },
    { speaker: 'Tony', text: 'Then I got grabbed like a cartoon side character.' },
    { speaker: 'June', text: 'You are not a side character. You’re… you. My person.' },
    { speaker: 'Tony', text: 'It’s like… every thought in my head is calling me a failure and it sounds so believable.' },
    { speaker: 'June', text: 'Okay. Listen to me. Look at me.' },
    { speaker: 'June', text: 'Amor… estos pensamientos y emociones que estás experimentando, aunque suenen reales y convincentes, son falsos.' },
    { speaker: 'June', text: 'Has logrado muchísimo, eres un gran amigo, hermano, trabajador y novio.' },
    { speaker: 'June', text: 'Pero más importante: mereces amor y cuidado por el simple hecho de existir.' },
    { speaker: 'June', text: 'Dios te ama por el simple hecho de ser su hijo.' },
    { speaker: 'June', text: 'Y mereces todo porque eres su hijo.' },
    { speaker: 'Tony', text: '…I don’t deserve you.' },
    { speaker: 'June', text: 'That’s the lie. You don’t earn your right to be loved by suffering.' },
    { speaker: 'June', text: 'You’re allowed to be scared. You’re allowed to need help. You’re still you.' },
    { speaker: 'Tony', text: 'I just… I wanted to make Christmas feel safe for you.' },
    { speaker: 'June', text: 'You do. Every day. The cocoa. The small check-ins. The way you try.' },
    { speaker: 'June', text: 'And I’m here. I’ve got you. We’re leaving together—okay?' },
    { speaker: 'Tony', text: 'Okay. Together.' }
  ] as DialogueLine[],

  diracSwordAppears: [
    { speaker: 'June', text: '…Okay, so the forest kidnaps my boyfriend and now a sword is just… here.' },
    { speaker: 'June', text: 'And on it: (i γ^μ ∂_μ − m) ψ = 0.' },
    { speaker: 'June', text: 'Dirac. Great. Nothing says romance like relativistic quantum mechanics.' }
  ] as DialogueLine[],

  afterBearDefeated: [
    { speaker: 'Tony', text: 'You… you actually did it.' },
    { speaker: 'June', text: 'I’m going to be sore for a week, but yes.' },
    { speaker: 'Tony', text: 'I’ll find the keys to the gift box. I promise.' },
    { speaker: 'Tony', text: 'Whatever’s in that gift… it matters.' },
    { speaker: 'June', text: 'Okay. Then I’m heading north. Something’s waiting behind that gate.' }
  ] as DialogueLine[],

  // Final Act: North gate capture + swap to Tony
  finalGateArrival: [
    { speaker: 'Tony', text: 'North… there it is.' },
    { speaker: 'June', text: 'Okay. We do this, then we go home. Tree, cocoa, gift. Normal.' },
    { speaker: 'Tony', text: 'I’ve got the gift keys. Whatever’s in that box… we’ll face it together.' }
  ] as DialogueLine[],

  finalJuneCaptured: [
    { speaker: 'June', text: '…Wait. Why is the air doing that?' },
    { speaker: 'Tony', text: 'June—behind you!' },
    { speaker: 'June', text: 'Oh—NOPE—' }
  ] as DialogueLine[],

  finalTonyResolve: [
    { speaker: 'Tony', text: "June! Hang on—I'm coming." },
    { speaker: 'Tony', text: 'No—no. Breathe. Look at me.' },
    { speaker: 'Tony', text: 'You’re still here. I’m still here. They don’t get to take you from me.' },
    { speaker: 'Tony', text: 'Se que aveces es dificil recordarlo o creerlo...' },
    { speaker: 'Tony', text: 'honey, todo lo que has logrado hasta ahora es porque tomaste la decision dificil de salir Adelante.' },
    { speaker: 'Tony', text: 'Se que aveces las voces o personas te hacen sentir como si realmente no has logrado nada.' },
    { speaker: 'Tony', text: 'Pero las cosas que has hecho a sido principalmente por Dios y por tus esfuerzos mi Cielo.' },
    { speaker: 'Tony', text: 'Nadie puede quitarte eso, el dinero que has hecho, las personas que has ayudado, y el crecimiento que has tenido.' },
    { speaker: 'Tony', text: 'I’m not letting the dark rewrite your story. Not tonight. Not ever.' },
    { speaker: 'Tony', text: 'Okay. Tony mode. Breathe. Move.' }
  ] as DialogueLine[],

  finalBossAfter: [
    { speaker: 'Tony', text: 'You’re safe. I’ve got you.' },
    { speaker: 'June', text: 'You… you came back for me.' },
    { speaker: 'Tony', text: 'Always.' }
  ] as DialogueLine[],

  villagePraise: [
    { speaker: 'Villager', text: 'The curse is gone!' },
    { speaker: 'Villager', text: 'Thank you—thank you!' },
    { speaker: 'June', text: 'Uh. Hi. This is… a lot.' },
    { speaker: 'Tony', text: 'We should find Gabi. He’ll know what this means.' }
  ] as DialogueLine[],

  // Laponia: villagers complain that the monster stopped the snow
  laponiaNoSnow: [
    { speaker: 'Villager', text: 'It’s Christmas… and there’s no snow.' },
    { speaker: 'Villager', text: 'The monster stole our winter. The air feels wrong.' },
    { speaker: 'June', text: 'We… dealt with the thing behind the gate. Is this connected?' },
    { speaker: 'Tony', text: 'If it was feeding on fear… maybe it was feeding on *winter* too.' }
  ] as DialogueLine[],

  // Laponia: sermon + reward with snowfall
  laponiaHeavenSermon: [
    { speaker: 'Voice from Heaven', text: 'People of Laponia—hear me.' },
    { speaker: 'Voice from Heaven', text: 'Fear froze your joy. Darkness silenced your season.' },
    { speaker: 'Voice from Heaven', text: 'But courage walked your roads. Love did not turn back.' },
    { speaker: 'Voice from Heaven', text: 'Well done. Let winter return—not as a curse… but as a gift.' },
    { speaker: 'Villager', text: 'Look… look! The air—' },
    { speaker: 'June', text: 'Oh my God. It’s starting…' },
    { speaker: 'Tony', text: 'Snow.' }
  ] as DialogueLine[],

  gabiFinalWithCouple: [
    { speaker: 'Gabi', text: 'You returned… and not alone.' },
    { speaker: 'June', text: 'Long story. Short version: we won.' },
    { speaker: 'Tony', text: 'And we’re ready to go home.' },
    { speaker: 'Gabi', text: 'Then go. Finish your night. The gift was never the end… only the beginning.' }
  ] as DialogueLine[],
  
  // Puzzle hint notes (more mysterious)
  puzzleHint1: [
    {
      speaker: 'Carved Stone',
      text: "When the evergreen reaches toward the crescent moon, the guiding star reveals itself."
    }
  ] as DialogueLine[],
  
  puzzleHint2: [
    {
      speaker: 'Ancient Note',
      text: "The sum of symbols unlocks the path: PINE + MOON = STAR. Seek the balance."
    }
  ] as DialogueLine[],
  
  // Puzzle solved (more wonder)
  puzzleSolved: [
    {
      speaker: 'June',
      text: "Whoa! The stones are glowing—something's manifesting out of thin air!"
    },
    {
      speaker: 'June',
      text: "A chest just… appeared? Okay, officially weirder than I thought."
    }
  ] as DialogueLine[],
  
  // Got Key Relic (more awe)
  gotKeyRelic: [
    {
      speaker: 'June',
      text: "This key… it's warm and pulsing with light. Feels ancient, like really ancient."
    },
    {
      speaker: 'June',
      text: "That sealed gate in the woods—bet this is what it's been waiting for."
    }
  ] as DialogueLine[],
  
  // Boss gate without key (frustration + curiosity)
  bossGateNoKey: [
    {
      speaker: 'June',
      text: "A massive gate covered in symbols… it's sealed tight. Like 'not happening without a key' tight."
    }
  ] as DialogueLine[],
  
  // Boss gate with key (anticipation)
  bossGateWithKey: [
    {
      speaker: 'June',
      text: "The key's glowing brighter… vibrating in my hand. This gate is definitely about to open."
    },
    {
      speaker: 'June',
      text: "Okay June, let's see what you've been guarding for who-knows-how-long."
    }
  ] as DialogueLine[],
  
  // Boss defeated (relief + wonder)
  bossDefeated: [
    {
      speaker: 'June',
      text: "*panting* What… what WAS that thing? Some kind of guardian?"
    },
    {
      speaker: 'June',
      text: "It left behind this sigil—glowing with the same light as the key. This has to be what Gabi needs!"
    }
  ] as DialogueLine[],
  
  // Return to Gabi after boss (THE REVEAL - enhanced)
  gabrielReveal: [
    {
      speaker: 'Gabi',
      text: "You've returned! And you're carrying… the Memory Sigil. I can feel its power from here."
    },
    {
      speaker: 'June',
      text: "Yeah, about that—had to fight a possessed deer-thing. You're welcome, by the way."
    },
    {
      speaker: 'Gabi',
      text: "Let me… *touching sigil* Oh. OH. It's all coming back."
    },
    {
      speaker: 'Gabi',
      text: "My name is Gabriel. I am… I am a messenger."
    },
    {
      speaker: 'June',
      text: "Gabriel? Hold on—Gabriel like THE Gabriel? From… from the Bible?"
    },
    {
      speaker: 'Gabriel',
      text: "Yes, child. I was sent to bring tidings to a young woman named Mary."
    },
    {
      speaker: 'Gabriel',
      text: "She will bear a son, and his name shall be Emmanuel—'God is with us.'"
    },
    {
      speaker: 'June',
      text: "I'm sorry, WHAT? I helped an actual ANGEL remember his mission? This is the weirdest Tuesday ever!"
    },
    {
      speaker: 'Gabriel',
      text: "You have done more than help—you've reminded me why I walk among mortals."
    },
    {
      speaker: 'Gabriel',
      text: "Please, take this gift. A small reminder that hope is born in the most unexpected places."
    },
    {
      speaker: 'June',
      text: "A tiny nativity manger… it's beautiful. Like impossibly beautiful."
    },
    {
      speaker: 'Gabriel',
      text: "May it remind you: even in the coldest winter, new light finds its way. Farewell, June."
    },
    {
      speaker: 'June',
      text: "Wait, you're just—okay, he's gone. Vanished. Of course. Because angels."
    }
  ] as DialogueLine[],
  
  // Cabin ending - Post-Final-Act (Tony was part of the whole journey)
  cabinEnding: [
    {
      speaker: 'June',
      text: "Home. Actual home. With walls that don't try to eat us."
    },
    {
      speaker: 'Tony',
      text: "I’m still processing the part where you got kidnapped and I had to do the hero thing."
    },
    {
      speaker: 'June',
      text: "You did great. You did *you*—even when you were scared. That’s the whole point."
    },
    {
      speaker: 'Tony',
      text: "Okay… then I'm officially requesting: cocoa, blankets, and a tree that stays put."
    },
    {
      speaker: 'June',
      text: "Deal. And—good news. You *did* find the gift keys."
    },
    {
      speaker: 'Tony',
      text: "I did. My brain is finally useful again."
    },
    {
      speaker: 'June',
      text: "First… we decorate together. Then we open the gift. No more mysteries tonight."
    }
  ] as DialogueLine[],
  
  // Gift opened (heartwarming ending with gift message)
  giftOpened: [
    {
      speaker: 'June',
      text: "It's opening! The keys worked!"
    },
    {
      speaker: 'Note in Box',
      text: "To those who seek wonder: remember that magic lives in kindness, mysteries hide in plain sight, and every ending is a new beginning. Merry Christmas. —G"
    },
    {
      speaker: 'June',
      text: "Wait, there's something else... a gift card!"
    },
    {
      speaker: 'Gift Card',
      text: "🎁 Special Christmas Gift: amazon.com/gift | Code: NAVIDADATLAS2024"
    },
    {
      speaker: 'Tony',
      text: "That's… actually really sweet. And generous! Who's 'G'?"
    },
    {
      speaker: 'June',
      text: "An old friend. A very old friend. Merry Christmas, Tony."
    },
    {
      speaker: 'Tony',
      text: "Merry Christmas, June. Best weird adventure-Christmas ever."
    }
  ] as DialogueLine[],
  
  // Generic interactions (more personality)
  christmasTree: [
    {
      speaker: 'June',
      text: "The tree smells like pine and cinnamon. Tony always picks the best ones."
    }
  ] as DialogueLine[],
  
  lockedGift: [
    {
      speaker: 'June',
      text: "Locked tighter than Fort Knox. No amount of shaking or pleading is opening this thing."
    }
  ] as DialogueLine[]
};

