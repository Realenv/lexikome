export const pronouns_by_tenses: {[key: string]: {[key: string]: string[]}} = 
{
  "french": {
    "Ind. Présent": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Ind. Imparfait": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Ind. Passé simple": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Ind. Futur simple": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Ind. Passé composé": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Ind. Plus-que-parfait": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Ind. Futur antérieur": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Ind. Passé récent": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Ind. Futur proche": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Subj. Présent": ["que je", "que tu", "qu'il", "qu'elle", "qu'on", "que nous", "que vous", "qu'ils", "qu'elles"],
    "Subj. Passé": ["que je", "que tu", "qu'il", "qu'elle", "qu'on", "que nous", "que vous", "qu'ils", "qu'elles"],
    "Cond. Présent": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Cond. Passé": ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"],
    "Impératif Présent": ["implicite: tu", "implicite: nous", "implicite: vous"],
    "Infinitif Présent": ["impersonnel"],
    "Infinitif Passé": ["impersonnel"],
    "Participe Présent": ["impersonnel"],
    "Participe Passé": ["impersonnel"],
    "Gérondif Présent": ["impersonnel"]
  },
  "english": {
    "Present Simple": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Present Continuous": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Present Perfect": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Present Perfect Cont.": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Past Simple": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Past Continuous": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Past Perfect": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Past Perfect Cont.": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Future Simple": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Future Continuous": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Future Perfect": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Going to - Present": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Going to - Past": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Used to": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Cond. Present": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Cond. Perfect": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Subj. Past (were)": ["I", "you (sg.)", "he", "she", "it", "we", "you (pl.)", "they"],
    "Imperative": ["implied: you", "implied: we"],
    "Infinitive": ["non-finite"],
    "Gerund / Pres. Part.": ["non-finite"],
    "Past Participle": ["non-finite"]
  },
  "turkish": {
    "Geniş Zaman": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Şimdiki Zaman": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Görülen Geçmiş Zaman": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Duyulan Geçmiş Zaman": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Gelecek Zaman": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Şimdiki Zamanın Hikayesi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Şimdiki Zamanın Rivayeti": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Şimdiki Zamanın Şartı": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Geniş Zamanın Hikayesi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Geniş Zamanın Rivayeti": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Geniş Zamanın Şartı": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Görülen Geçmişin Hikayesi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Duyulan Geçmişin Hikayesi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Gelecek Zamanın Hikayesi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Gelecek Zamanın Rivayeti": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Şart Kipi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Şart Kipinin Hikayesi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "İstek Kipi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Gereklilik Kipi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Gereklilik Kipinin Hikayesi": ["ben", "sen", "o", "biz", "siz", "onlar"],
    "Emir Kipi": ["örtük: sen", "örtük: o", "örtük: siz", "örtük: onlar"],
    "Mastar / İsim-Fiil": ["eylemsi"],
    "Sıfat-Fiil": ["eylemsi"],
    "Zarf-Fiil": ["eylemsi"]
  },
  "russian": {
    "Настоящее (НСВ)": ["я", "ты", "он", "она", "оно", "мы", "вы", "они"],
    "Прошедшее (НСВ)": ["я (м.р.)", "я (ж.р.)", "ты (м.р.)", "ты (ж.р.)", "он", "она", "оно", "мы", "вы", "они"],
    "Прошедшее (СВ)": ["я (м.р.)", "я (ж.р.)", "ты (м.р.)", "ты (ж.р.)", "он", "она", "оно", "мы", "вы", "они"],
    "Будущее простое (СВ)": ["я", "ты", "он", "она", "оно", "мы", "вы", "они"],
    "Будущее сложное (НСВ)": ["я", "ты", "он", "она", "оно", "мы", "вы", "они"],
    "Сослагательное (НСВ)": ["я (м.р.)", "я (ж.р.)", "ты (м.р.)", "ты (ж.р.)", "он", "она", "оно", "мы", "вы", "они"],
    "Сослагательное (СВ)": ["я (м.р.)", "я (ж.р.)", "ты (м.р.)", "ты (ж.р.)", "он", "она", "оно", "мы", "вы", "они"],
    "Повелительное (НСВ)": ["подразум.: ты", "подразум.: вы"],
    "Повелительное (СВ)": ["подразум.: ты", "подразум.: вы"],
    "Инфинитив (НСВ)": ["неизм."],
    "Инфинитив (СВ)": ["неизм."],
    "Действ. причастие наст. вр.": ["причастие"],
    "Действ. причастие прош. вр.": ["причастие"],
    "Страд. причастие прош. вр.": ["причастие"],
    "Деепричастие (НСВ)": ["деепричастие"],
    "Деепричастие (СВ)": ["деепричастие"]
  },
  "arabic": {
    "الماضي المعلوم": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "الماضي المجهول": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "المضارع المرفوع المعلوم": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "المضارع المرفوع المجهول": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "المضارع المنصوب المعلوم": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "المضارع المنصوب المجهول": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "المضارع المجزوم المعلوم": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "المضارع المجزوم المجهول": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "المستقبل القريب": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "المستقبل البعيد": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "الماضي المستمر": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "الماضي التام": [
      "أنا", "نحن", "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)",
      "أنتم", "أنتنّ", "هو", "هي", "هما (م)", "هما (ث)", "هم", "هنّ"
    ],
    "الأمر": [
      "أنتَ", "أنتِ", "أنتما (م)", "أنتما (ث)", "أنتم", "أنتنّ"
    ],
    "المصدر": [
      "غير متصرف"
    ],
    "اسم الفاعل": [
      "غير متصرف"
    ],
    "اسم المفعول": [
      "غير متصرف"
    ]
  }
}