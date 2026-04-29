export type StaticDialogOption = {
  text: string;
  quality: 'good' | 'ok' | 'awkward';
  feedback: string;
  correction?: string;
};

export type StaticTurn = {
  id: string;
  npc_message: string;
  npc_mood: 'happy' | 'neutral' | 'confused' | 'impatient';
  options: [StaticDialogOption, StaticDialogOption, StaticDialogOption];
  scene_complete?: boolean;
};

export type ScenarioDialogue = {
  stageType: string;
  language: string;
  sessionSize: number;
  turns: StaticTurn[];
};

// ─── Café · Spanish ──────────────────────────────────────────────────────────

const cafeEs: ScenarioDialogue = {
  stageType: 'cafe',
  language: 'es',
  sessionSize: 5,
  turns: [
    {
      id: 'cafe-es-01',
      npc_message: '¡Buenos días! ¿Qué le pongo?',
      npc_mood: 'happy',
      options: [
        {
          text: 'Un café con leche, por favor.',
          quality: 'good',
          feedback: 'Mükemmel. Nazik, doğal ve sahnede standart bir sipariş.',
        },
        {
          text: 'Quiero un café.',
          quality: 'ok',
          feedback: 'Anlaşılıyor ama "por favor" eklemek tonu yumuşatırdı.',
          correction: 'Un café, por favor.',
        },
        {
          text: 'Dame un café.',
          quality: 'awkward',
          feedback: '"Dame" emir kipi — kasiyere fazla sert geliyor.',
          correction: 'Un café, por favor.',
        },
      ],
    },
    {
      id: 'cafe-es-02',
      npc_message: '¿Grande o pequeño?',
      npc_mood: 'neutral',
      options: [
        {
          text: 'Grande, por favor.',
          quality: 'good',
          feedback: 'Net ve kibar. Tam beklenen cevap.',
        },
        {
          text: 'Grande.',
          quality: 'ok',
          feedback: 'Doğru ama tek kelime biraz kuru kalıyor.',
          correction: 'Grande, por favor.',
        },
        {
          text: 'El más grande que tengas.',
          quality: 'awkward',
          feedback: '"En büyüğü ne varsa" — anlaşılır ama kasiyeri komik duruma düşürüyor.',
          correction: 'Grande, por favor.',
        },
      ],
    },
    {
      id: 'cafe-es-03',
      npc_message: '¿Para tomar aquí o para llevar?',
      npc_mood: 'neutral',
      options: [
        {
          text: 'Para tomar aquí, gracias.',
          quality: 'good',
          feedback: 'Kalıp doğru, "gracias" tonu sıcak tutuyor.',
        },
        {
          text: 'Aquí.',
          quality: 'ok',
          feedback: 'Anlaşılıyor ama eksik bir cevap.',
          correction: 'Para aquí, por favor.',
        },
        {
          text: 'Me quedo.',
          quality: 'awkward',
          feedback: '"Kalıyorum" — bu bağlamda garip, kasiyer kafayı karıştırır.',
          correction: 'Para tomar aquí, por favor.',
        },
      ],
    },
    {
      id: 'cafe-es-04',
      npc_message: '¿Le apetece algo de comer? Hoy tenemos croissants recién hechos.',
      npc_mood: 'happy',
      options: [
        {
          text: 'Sí, un croissant también, por favor.',
          quality: 'good',
          feedback: 'Doğal ve kibar bir kabul.',
        },
        {
          text: 'No, gracias.',
          quality: 'ok',
          feedback: 'Doğru reddetme biçimi.',
        },
        {
          text: 'No quiero comida.',
          quality: 'awkward',
          feedback: '"Yemek istemiyorum" doğrudan ve biraz kaba.',
          correction: 'No, gracias.',
        },
      ],
    },
    {
      id: 'cafe-es-05',
      npc_message: '¿Paga en efectivo o con tarjeta?',
      npc_mood: 'neutral',
      options: [
        {
          text: 'Con tarjeta, por favor.',
          quality: 'good',
          feedback: 'Net, kibar, tam kalıp.',
        },
        {
          text: 'Tarjeta.',
          quality: 'ok',
          feedback: 'Kısa ama anlaşılır.',
          correction: 'Con tarjeta, por favor.',
        },
        {
          text: 'Tengo dinero y tarjeta.',
          quality: 'awkward',
          feedback: 'Soruya cevap vermiyor — seçim yapman gerekiyor.',
          correction: 'Con tarjeta, por favor.',
        },
      ],
    },
    {
      id: 'cafe-es-06',
      npc_message: 'Son cinco minutos de espera, ¿le parece bien?',
      npc_mood: 'neutral',
      options: [
        {
          text: 'Claro, no hay prisa.',
          quality: 'good',
          feedback: '"No hay prisa" (acele yok) — doğal ve hoş bir yanıt.',
        },
        {
          text: 'Está bien.',
          quality: 'ok',
          feedback: 'Yeterli ama biraz soğuk.',
          correction: 'Claro, no hay problema.',
        },
        {
          text: 'Cinco minutos es mucho.',
          quality: 'awkward',
          feedback: 'Şikayet tonu gereksiz. Sahnede tuhaf bir gerginlik yaratır.',
          correction: 'No hay problema, gracias.',
        },
      ],
    },
    {
      id: 'cafe-es-07',
      npc_message: 'Puede sentarse donde quiera. ¿Prefiere interior o terraza?',
      npc_mood: 'happy',
      options: [
        {
          text: 'La terraza, por favor, si hay sitio.',
          quality: 'good',
          feedback: '"Si hay sitio" eklemek nezaketi gösteriyor — çok doğal.',
        },
        {
          text: 'Fuera, en la terraza.',
          quality: 'ok',
          feedback: 'Doğru ve anlaşılır.',
          correction: 'La terraza, por favor.',
        },
        {
          text: 'Quiero estar solo.',
          quality: 'awkward',
          feedback: 'Soruyu cevaplamıyor ve tuhaf bir his veriyor.',
          correction: 'La terraza, gracias.',
        },
      ],
    },
    {
      id: 'cafe-es-08',
      npc_message: 'Perdone, se nos ha acabado el café con leche. ¿Le va bien un cortado?',
      npc_mood: 'confused',
      options: [
        {
          text: 'Sí, un cortado está bien, gracias.',
          quality: 'good',
          feedback: 'Esnek ve kibar — sahne doğal akıyor.',
        },
        {
          text: 'Bueno, vale.',
          quality: 'ok',
          feedback: 'Kabul ama biraz isteksiz duyulabilir.',
          correction: 'Sí, claro, gracias.',
        },
        {
          text: 'No entiendo qué es un cortado.',
          quality: 'awkward',
          feedback: 'Dürüst ama sahnede akışı keser.',
          correction: '¿Qué lleva exactamente?',
        },
      ],
    },
    {
      id: 'cafe-es-09',
      npc_message: 'Aquí tiene su pedido. Son tres euros con cincuenta.',
      npc_mood: 'neutral',
      options: [
        {
          text: 'Aquí tiene, gracias.',
          quality: 'good',
          feedback: 'Doğal ödeme diyaloğu.',
        },
        {
          text: 'Toma.',
          quality: 'ok',
          feedback: '"Toma" biraz hızlı ve kısa ama kabul edilebilir.',
          correction: 'Aquí tiene.',
        },
        {
          text: '¿Tan caro?',
          quality: 'awkward',
          feedback: '"Bu kadar mı pahalı?" — kafede gereksiz bir yorum.',
          correction: 'Aquí tiene.',
        },
      ],
    },
    {
      id: 'cafe-es-10',
      npc_message: '¿Quiere un vaso de agua también? Es cortesía de la casa.',
      npc_mood: 'happy',
      options: [
        {
          text: 'Sí, muchas gracias, muy amable.',
          quality: 'good',
          feedback: '"Muy amable" — İspanyolcada sıkça kullanılan sıcak bir yanıt.',
        },
        {
          text: 'Sí, gracias.',
          quality: 'ok',
          feedback: 'Kısa ama yeterli.',
        },
        {
          text: 'No necesito agua.',
          quality: 'awkward',
          feedback: 'Reddediş biraz sert.',
          correction: 'No, gracias.',
        },
      ],
    },
    {
      id: 'cafe-es-11',
      npc_message: '¿Necesita la contraseña del wifi?',
      npc_mood: 'neutral',
      options: [
        {
          text: 'Sí, por favor, ¿me la puede dar?',
          quality: 'good',
          feedback: '"¿Me la puede dar?" — kibarca istemek için doğal kalıp.',
        },
        {
          text: 'Sí, el wifi, por favor.',
          quality: 'ok',
          feedback: 'Yaygın konuşma dili ama anlaşılır.',
          correction: 'Sí, por favor.',
        },
        {
          text: 'Deme el wifi.',
          quality: 'awkward',
          feedback: '"Deme" emir kipi — kasiyere kaba geliyor.',
          correction: 'Sí, por favor, ¿me la puede dar?',
        },
      ],
    },
    {
      id: 'cafe-es-12',
      npc_message: '¡Que disfrute! Si necesita algo más, avíseme.',
      npc_mood: 'happy',
      scene_complete: true,
      options: [
        {
          text: 'Muchas gracias, muy amable.',
          quality: 'good',
          feedback: 'Mükemmel kapanış. "Muy amable" her vedada işe yarar.',
        },
        {
          text: 'Gracias.',
          quality: 'ok',
          feedback: 'Yeterli ama biraz soğuk bir kapanış.',
          correction: 'Muchas gracias, hasta luego.',
        },
        {
          text: 'Adiós.',
          quality: 'awkward',
          feedback: 'Çok ani. Biraz daha sıcak bir kapanış daha iyi olurdu.',
          correction: 'Muchas gracias, hasta luego.',
        },
      ],
    },
  ],
};

// ─── Travel · Spanish ────────────────────────────────────────────────────────

const travelEs: ScenarioDialogue = {
  stageType: 'travel',
  language: 'es',
  sessionSize: 5,
  turns: [
    { id: 'travel-es-01', npc_message: 'Buenos días, ¿a dónde va?', npc_mood: 'neutral', options: [
      { text: 'Al centro, por favor. ¿Qué línea cojo?', quality: 'good', feedback: '"¿Qué línea cojo?" — yön sormak için doğal kalıp.' },
      { text: 'Al centro.', quality: 'ok', feedback: 'Anlaşılıyor ama yol tarifi istemedi.', correction: 'Al centro, por favor. ¿Cómo llego?' },
      { text: 'Quiero ir al centro de la ciudad.', quality: 'awkward', feedback: 'Çok uzun. Metro bağlamında doğrudan söyle.', correction: 'Al centro, ¿qué línea es?' },
    ]},
    { id: 'travel-es-02', npc_message: 'Tiene que coger la línea dos hasta Callao y cambiar a la línea tres.', npc_mood: 'neutral', options: [
      { text: 'Perdone, ¿puede repetirlo más despacio?', quality: 'good', feedback: '"¿Puede repetirlo más despacio?" — anlamadığında en doğal istek.' },
      { text: 'No entiendo.', quality: 'ok', feedback: 'Dürüst ama çok kısa, daha açıklayıcı olabilirdin.', correction: 'Lo siento, ¿puede repetir?' },
      { text: 'Habla muy rápido.', quality: 'awkward', feedback: 'Şikayet gibi duyuluyor. Kibar bir tekrar isteği daha iyi.', correction: '¿Puede repetirlo, por favor?' },
    ]},
    { id: 'travel-es-03', npc_message: '¿Tiene tarjeta de transporte o necesita un billete?', npc_mood: 'neutral', options: [
      { text: 'Necesito un billete sencillo, por favor.', quality: 'good', feedback: '"Billete sencillo" — tek yön bilet için standart ifade.' },
      { text: 'Un billete.', quality: 'ok', feedback: 'Anlaşılır ama hangi bilet olduğu belirsiz.', correction: 'Un billete sencillo, por favor.' },
      { text: 'No tengo nada.', quality: 'awkward', feedback: '"Hiçbir şeyim yok" — kafa karıştırıcı. Ne istediğini söyle.', correction: 'Un billete sencillo, por favor.' },
    ]},
    { id: 'travel-es-04', npc_message: 'Son dos euros con cincuenta. ¿Paga en efectivo?', npc_mood: 'neutral', options: [
      { text: 'Sí, aquí tiene.', quality: 'good', feedback: 'Kısa ve doğal.' },
      { text: 'Sí.', quality: 'ok', feedback: 'Yeterli ama parayı uzatmadın.', correction: 'Sí, aquí tiene.' },
      { text: '¿No aceptan tarjeta?', quality: 'awkward', feedback: 'Soru sormak yerine nakit ödeyebilirdin.', correction: 'Sí, aquí tiene.' },
    ]},
    { id: 'travel-es-05', npc_message: '¿Sabe dónde está la salida de Callao?', npc_mood: 'neutral', options: [
      { text: 'No, es mi primera vez. ¿Podría indicarme?', quality: 'good', feedback: '"Es mi primera vez" açıklaması empati kuruyor.' },
      { text: 'No sé.', quality: 'ok', feedback: 'Dürüst ama yardım istemedi.', correction: 'No, ¿puede ayudarme?' },
      { text: 'Soy turista.', quality: 'awkward', feedback: 'İlgisiz bilgi. Yardım iste.', correction: 'No lo sé, ¿me puede ayudar?' },
    ]},
    { id: 'travel-es-06', npc_message: 'El próximo tren sale en tres minutos, andén dos.', npc_mood: 'neutral', options: [
      { text: 'Gracias, voy al andén dos ahora mismo.', quality: 'good', feedback: 'Bilgiyi teyit ederek kibarca kapanış.' },
      { text: 'Vale, gracias.', quality: 'ok', feedback: 'Yeterli ama andén numarasını tekrar etmek iyi olurdu.' },
      { text: '¿Tres minutos? ¿Por qué tanto?', quality: 'awkward', feedback: 'Şikayet tonu gereksiz.', correction: 'Gracias, ¿el andén dos?' },
    ]},
    { id: 'travel-es-07', npc_message: '¿Va a la estación de Atocha?', npc_mood: 'neutral', options: [
      { text: 'Sí, ¿hay transbordo?', quality: 'good', feedback: '"¿Hay transbordo?" — aktarma olup olmadığını sormanın doğal yolu.' },
      { text: 'Sí.', quality: 'ok', feedback: 'Doğru ama aktarma bilgisi önemli, sorabilirdin.' },
      { text: 'No sé dónde está Atocha.', quality: 'awkward', feedback: 'Evet/hayır sorusuna bu cevap garip kaçar.', correction: 'Sí, ¿necesito cambiar de línea?' },
    ]},
    { id: 'travel-es-08', npc_message: 'Esta línea no para en Atocha los domingos. Tiene que coger el autobús.', npc_mood: 'confused', options: [
      { text: 'Entendido. ¿En qué parada cojo el autobús?', quality: 'good', feedback: 'Durumu kabul edip pratik soru sormak — doğru tepki.' },
      { text: 'Ah, vale.', quality: 'ok', feedback: 'Kabul etti ama otobüs durağını sorması gerekirdi.' },
      { text: 'Eso es un problema.', quality: 'awkward', feedback: '"Bu bir problem" — şikayet tonu sahnede gereksiz.', correction: '¿Dónde está la parada de autobús?' },
    ]},
    { id: 'travel-es-09', npc_message: '¿Le puedo ayudar con el equipaje?', npc_mood: 'happy', options: [
      { text: 'Sí, muchas gracias, es muy amable.', quality: 'good', feedback: '"Muy amable" — İspanyolcada sıkça kullanılan sıcak yanıt.' },
      { text: 'No, gracias, puedo solo.', quality: 'ok', feedback: 'Kibar ret.' },
      { text: 'Es muy pesado.', quality: 'awkward', feedback: '"Çok ağır" — soruyu cevaplamıyor.', correction: 'Sí, gracias, si no le importa.' },
    ]},
    { id: 'travel-es-10', npc_message: '¿Tiene billete de vuelta?', npc_mood: 'neutral', options: [
      { text: 'No, ¿puedo comprar uno aquí?', quality: 'good', feedback: 'Durumu açıklayıp pratik çözüm arıyor.' },
      { text: 'No.', quality: 'ok', feedback: 'Dürüst ama nerede alabileceğini sorabilirdi.' },
      { text: 'No necesito.', quality: 'awkward', feedback: 'Gramer hatalı ve tuhaf.', correction: 'No, no necesito billete de vuelta.' },
    ]},
    { id: 'travel-es-11', npc_message: 'Hay retraso de diez minutos por obras en la vía.', npc_mood: 'impatient', options: [
      { text: 'Gracias por avisar. ¿Habrá más retrasos hoy?', quality: 'good', feedback: 'Teşekkür edip ek bilgi sormak — olgun tepki.' },
      { text: 'Vale, gracias.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Diez minutos es demasiado.', quality: 'awkward', feedback: 'Şikayet eder gibi — gereksiz.', correction: 'Entendido, gracias.' },
    ]},
    { id: 'travel-es-12', npc_message: 'Ha llegado a su destino. ¡Buen viaje!', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Muchas gracias por su ayuda.', quality: 'good', feedback: 'Mükemmel kapanış.' },
      { text: 'Gracias.', quality: 'ok', feedback: 'Yeterli ama biraz soğuk.' },
      { text: 'Adiós.', quality: 'awkward', feedback: 'Çok ani. Daha sıcak bir kapanış daha iyi.', correction: 'Gracias, hasta luego.' },
    ]},
  ],
};

// ─── Business · Spanish ───────────────────────────────────────────────────────

const businessEs: ScenarioDialogue = {
  stageType: 'business',
  language: 'es',
  sessionSize: 5,
  turns: [
    { id: 'biz-es-01', npc_message: 'Buenos días, ¿tiene cita?', npc_mood: 'neutral', options: [
      { text: 'Sí, tengo una reunión con el señor García a las diez.', quality: 'good', feedback: 'Kişi adı ve saat — resepsiyon için doğal giriş.' },
      { text: 'Sí, tengo reunión.', quality: 'ok', feedback: 'Eksik bilgi. Kiminle olduğunu belirtmek daha profesyonel.', correction: 'Sí, con el señor García.' },
      { text: 'Sí, vine para una reunión.', quality: 'awkward', feedback: '"Vine" geçmiş zaman — "tengo" daha doğru.', correction: 'Sí, tengo cita con García.' },
    ]},
    { id: 'biz-es-02', npc_message: '¿Puede decirme el propósito de la reunión?', npc_mood: 'neutral', options: [
      { text: 'Vengo a presentar nuestra propuesta de colaboración.', quality: 'good', feedback: 'Net ve profesyonel.' },
      { text: 'Para hablar de negocios.', quality: 'ok', feedback: 'Çok genel, daha spesifik olabilirdin.', correction: 'Para presentar una propuesta.' },
      { text: 'No sé exactamente.', quality: 'awkward', feedback: 'Toplantının amacını bilmemek profesyonel görünmüyor.', correction: 'Vengo a discutir una propuesta.' },
    ]},
    { id: 'biz-es-03', npc_message: 'Por favor, tome asiento. El señor García llegará en unos minutos.', npc_mood: 'neutral', options: [
      { text: 'Gracias. ¿Puedo dejar aquí mi abrigo?', quality: 'good', feedback: 'Kibarca pratik bir soru.' },
      { text: 'Gracias.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Estoy cansado de esperar.', quality: 'awkward', feedback: 'Henüz oturmadın bile — bu yorum erken ve itici.', correction: 'Gracias, le espero aquí.' },
    ]},
    { id: 'biz-es-04', npc_message: 'Encantado de conocerle. He revisado su propuesta y tengo algunas preguntas.', npc_mood: 'neutral', options: [
      { text: 'Igualmente. Por supuesto, estaré encantado de responder.', quality: 'good', feedback: '"Igualmente" + hazır olduğunu belirtmek — profesyonel açılış.' },
      { text: 'Encantado. Dígame.', quality: 'ok', feedback: 'Kısa ama kabul edilebilir.' },
      { text: 'Hola. ¿Qué preguntas?', quality: 'awkward', feedback: 'Çok gayri resmi ve aceleci.', correction: 'Igualmente, con mucho gusto.' },
    ]},
    { id: 'biz-es-05', npc_message: 'El presupuesto que proponen parece elevado. ¿Hay margen de negociación?', npc_mood: 'impatient', options: [
      { text: 'Entiendo su preocupación. Podemos revisar las condiciones juntos.', quality: 'good', feedback: 'Empati + çözüm odaklı — müzakerede doğru ton.' },
      { text: 'Sí, podemos hablar del precio.', quality: 'ok', feedback: 'Açık ama biraz zayıf duruyor.' },
      { text: 'El precio es justo.', quality: 'awkward', feedback: 'Müşteriyi savunmaya geçiriyor — müzakere yerine çatışma.', correction: 'Podemos encontrar una solución.' },
    ]},
    { id: 'biz-es-06', npc_message: '¿Cuándo podrían empezar si llegamos a un acuerdo?', npc_mood: 'neutral', options: [
      { text: 'Podríamos empezar a principios del mes que viene, si le parece bien.', quality: 'good', feedback: '"Si le parece bien" — karşı tarafı da sürece dahil ediyor.' },
      { text: 'El mes que viene.', quality: 'ok', feedback: 'Net ama biraz kısa.' },
      { text: 'Depende.', quality: 'awkward', feedback: '"Bağlı" — belirsiz ve profesyonelce değil.', correction: 'Podríamos empezar en dos o tres semanas.' },
    ]},
    { id: 'biz-es-07', npc_message: 'Necesitamos referencias de proyectos similares.', npc_mood: 'neutral', options: [
      { text: 'Por supuesto, puedo enviarle tres referencias esta misma semana.', quality: 'good', feedback: 'Somut taahhüt ve zaman çerçevesi — güven veriyor.' },
      { text: 'Tenemos referencias.', quality: 'ok', feedback: 'Var mı yok mu belirsiz, gönderme taahhüdü eksik.', correction: 'Le envío las referencias mañana.' },
      { text: 'Todos nuestros clientes están contentos.', quality: 'awkward', feedback: 'İspat edilmemiş iddia — referans istenmiş, bunu ver.', correction: 'Le mando referencias concretas esta semana.' },
    ]},
    { id: 'biz-es-08', npc_message: '¿Incluye el precio el soporte técnico después de la entrega?', npc_mood: 'neutral', options: [
      { text: 'Sí, incluimos soporte técnico durante seis meses sin coste adicional.', quality: 'good', feedback: 'Net, somut, müşteriye değer katan cevap.' },
      { text: 'Sí, está incluido.', quality: 'ok', feedback: 'Doğru ama detay eksik.' },
      { text: 'Depende del contrato.', quality: 'awkward', feedback: '"Sözleşmeye bağlı" — belirsiz ve güvensiz duyuluyor.', correction: 'Sí, seis meses de soporte incluidos.' },
    ]},
    { id: 'biz-es-09', npc_message: 'Voy a necesitar consultarlo con mi equipo antes de decidir.', npc_mood: 'neutral', options: [
      { text: 'Por supuesto. ¿Cuándo podría tener una respuesta?', quality: 'good', feedback: 'Baskı yapmadan zaman çerçevesi istemek — profesyonel.' },
      { text: 'Está bien.', quality: 'ok', feedback: 'Kabul etti ama ne zaman duyacağını sormadı.' },
      { text: 'Espero que decidan pronto.', quality: 'awkward', feedback: 'Hafif baskı tonu — erken.', correction: '¿Cuándo podré tener noticias?' },
    ]},
    { id: 'biz-es-10', npc_message: '¿Puede dejarnos una copia de la propuesta?', npc_mood: 'neutral', options: [
      { text: 'Claro, tengo copias impresas y también le envío la versión digital.', quality: 'good', feedback: 'İki format sunmak — hazırlıklı ve profesyonel.' },
      { text: 'Sí, aquí tiene.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'La propuesta está en mi email.', quality: 'awkward', feedback: 'Kendine göre pratik ama karşı tarafa zor.', correction: 'Aquí tiene una copia impresa.' },
    ]},
    { id: 'biz-es-11', npc_message: '¿Tiene tarjeta de visita?', npc_mood: 'neutral', options: [
      { text: 'Sí, aquí tiene. Y le añado también mi LinkedIn si me lo permite.', quality: 'good', feedback: 'Kart + LinkedIn — networking\'de doğal bağlantı kurma.' },
      { text: 'Sí, aquí tiene.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'No, pero tengo WhatsApp.', quality: 'awkward', feedback: 'Resmi iş görüşmesinde WhatsApp önermek uygunsuz.', correction: 'Sí, aquí tiene mi tarjeta.' },
    ]},
    { id: 'biz-es-12', npc_message: 'Ha sido un placer. Le contactaremos la próxima semana.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Igualmente, quedo a su disposición para cualquier consulta.', quality: 'good', feedback: '"Quedo a su disposición" — iş görüşmesi kapanışı için standart, olgun ifade.' },
      { text: 'Gracias, hasta pronto.', quality: 'ok', feedback: 'Yeterli kapanış.' },
      { text: 'Espero su llamada.', quality: 'awkward', feedback: 'Biraz iteleme tonu var.', correction: 'Muchas gracias, estoy a su disposición.' },
    ]},
  ],
};

// ─── Social · Spanish ─────────────────────────────────────────────────────────

const socialEs: ScenarioDialogue = {
  stageType: 'social',
  language: 'es',
  sessionSize: 5,
  turns: [
    { id: 'social-es-01', npc_message: '¡Hola! ¿Es tu primera vez aquí?', npc_mood: 'happy', options: [
      { text: 'Sí, me lo recomendaron unos amigos. ¿Tú vienes mucho?', quality: 'good', feedback: 'Cevap verip karşı soruyla konuşmayı sürdürmek — sosyal akış.' },
      { text: 'Sí, primera vez.', quality: 'ok', feedback: 'Doğru ama konuşmayı ilerletmiyor.' },
      { text: 'No conozco a nadie aquí.', quality: 'awkward', feedback: 'Olumsuz açılış, ortamı soğutuyor.', correction: 'Sí, vine con unos amigos.' },
    ]},
    { id: 'social-es-02', npc_message: '¿De dónde eres?', npc_mood: 'happy', options: [
      { text: 'Soy de Turquía, de Estambul. ¿Y tú?', quality: 'good', feedback: 'Kendinle ilgili bilgi + karşı soru — sohbeti ikiye katlar.' },
      { text: 'De Turquía.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Soy extranjero.', quality: 'awkward', feedback: '"Yabancıyım" — soruyu cevaplamıyor.', correction: 'Soy de Turquía. ¿Y tú?' },
    ]},
    { id: 'social-es-03', npc_message: '¿A qué te dedicas?', npc_mood: 'happy', options: [
      { text: 'Trabajo en tecnología. ¿Y tú, a qué te dedicas?', quality: 'good', feedback: 'Kısa cevap + karşı soru — doğal sohbet ritmi.' },
      { text: 'Soy ingeniero.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Trabajo mucho.', quality: 'awkward', feedback: 'Soruya cevap vermiyor.', correction: 'Trabajo en tecnología, ¿y tú?' },
    ]},
    { id: 'social-es-04', npc_message: '¿Qué te parece la música de esta noche?', npc_mood: 'happy', options: [
      { text: 'Me encanta, tiene mucha energía. ¿Conoces al grupo?', quality: 'good', feedback: 'Görüş + bilgi sorusu — sohbeti derinleştirir.' },
      { text: 'Está bien.', quality: 'ok', feedback: 'Kabul edilebilir ama heyecansız.' },
      { text: 'No entiendo esta música.', quality: 'awkward', feedback: 'Sosyal ortamda negatif yorum konuşmayı öldürür.', correction: 'Es interesante, ¿tú qué opinas?' },
    ]},
    { id: 'social-es-05', npc_message: '¿Quieres tomar algo? Yo invito.', npc_mood: 'happy', options: [
      { text: 'Muy amable, una cerveza estaría genial, gracias.', quality: 'good', feedback: '"Muy amable" kabul ederken nezaket gösteriyor.' },
      { text: 'Sí, gracias.', quality: 'ok', feedback: 'Yeterli ama ne istediğini söylemedin.' },
      { text: 'No, tengo bebida.', quality: 'awkward', feedback: 'İyi niyetli teklifi reddedişte "tengo bebida" soğuk.', correction: 'No gracias, ya tengo, pero gracias por ofrecerte.' },
    ]},
    { id: 'social-es-06', npc_message: '¿Cuánto tiempo llevas en España?', npc_mood: 'happy', options: [
      { text: 'Llevo tres meses. Todavía estoy aprendiendo el idioma.', quality: 'good', feedback: 'Kişisel detay + alçakgönüllülük — sempati çekiyor.' },
      { text: 'Tres meses.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'No mucho tiempo.', quality: 'awkward', feedback: 'Belirsiz cevap.', correction: 'Unos meses, todavía me estoy adaptando.' },
    ]},
    { id: 'social-es-07', npc_message: '¿Conoces algún buen restaurante por aquí?', npc_mood: 'happy', options: [
      { text: 'Aún no mucho, soy nuevo. ¿Tú me recomiendas alguno?', quality: 'good', feedback: 'Bilmediğini kabul edip öneri istemek — dönüştürücü soru.' },
      { text: 'No sé.', quality: 'ok', feedback: 'Dürüst ama fırsatı kaçırıyor.' },
      { text: 'No conozco la ciudad.', quality: 'awkward', feedback: 'Konuşmayı bitiriyor.', correction: 'No mucho, ¿tú qué recomiendas?' },
    ]},
    { id: 'social-es-08', npc_message: 'Oye, ¿bailas?', npc_mood: 'happy', options: [
      { text: 'Un poco, pero me apunto. ¡Vamos!', quality: 'good', feedback: '"Me apunto" — dahil olmak için doğal ve enerjik yanıt.' },
      { text: 'No sé bailar.', quality: 'ok', feedback: 'Dürüst ret.' },
      { text: 'No, estoy cansado.', quality: 'awkward', feedback: 'Partide yorgunluk bahanesi soğuk kaçar.', correction: 'No mucho, pero lo intento.' },
    ]},
    { id: 'social-es-09', npc_message: 'Oye, te presento a mi amigo Carlos.', npc_mood: 'happy', options: [
      { text: 'Hola Carlos, encantado. ¿También eres de aquí?', quality: 'good', feedback: 'Selamlama + soru — tanışmayı hemen sohbete çeviriyor.' },
      { text: 'Hola, encantado.', quality: 'ok', feedback: 'Yeterli ama devam etmiyor.' },
      { text: 'Hola.', quality: 'awkward', feedback: 'Çok kısa tanışma, soğuk duyuluyor.', correction: 'Hola Carlos, mucho gusto.' },
    ]},
    { id: 'social-es-10', npc_message: '¿Tienes Instagram? Podríamos seguirnos.', npc_mood: 'happy', options: [
      { text: 'Sí, claro. Te busco ahora mismo.', quality: 'good', feedback: 'Sıcak ve direkt kabul.' },
      { text: 'Sí, @nombre.', quality: 'ok', feedback: 'Doğru ama kullanıcı adı paylaşmak zaten yeterli.' },
      { text: 'No uso mucho Instagram.', quality: 'awkward', feedback: 'Gereksiz açıklama — ya kabul ya kibarca ret.', correction: 'Sí, te mando una solicitud.' },
    ]},
    { id: 'social-es-11', npc_message: '¿Qué planes tienes para el fin de semana?', npc_mood: 'happy', options: [
      { text: 'Quiero explorar el barrio. ¿Tú tienes algún plan?', quality: 'good', feedback: 'Cevap + karşı soru — sohbeti canlı tutuyor.' },
      { text: 'No sé todavía.', quality: 'ok', feedback: 'Dürüst ama devam etmiyor.' },
      { text: 'Probablemente dormir mucho.', quality: 'awkward', feedback: 'Negatif/kapanık mesaj, yeni bir arkadaşa garip kaçar.', correction: 'No tengo planes fijos, ¿tú?' },
    ]},
    { id: 'social-es-12', npc_message: '¡Ha sido un placer! Espero verte pronto por aquí.', npc_mood: 'happy', scene_complete: true, options: [
      { text: '¡Igualmente! Me alegra haberte conocido. ¡Hasta pronto!', quality: 'good', feedback: 'Sıcak ve karşılıklı kapanış.' },
      { text: 'Gracias, hasta luego.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Adiós.', quality: 'awkward', feedback: 'Çok kuru — yeni bir arkadaşa bu kapanış soğuk.', correction: 'Ha sido un placer, ¡hasta pronto!' },
    ]},
  ],
};

// ─── Café · French ───────────────────────────────────────────────────────────

const cafeFr: ScenarioDialogue = {
  stageType: 'cafe',
  language: 'fr',
  sessionSize: 5,
  turns: [
    { id: 'cafe-fr-01', npc_message: 'Bonjour, qu\'est-ce que je vous sers ?', npc_mood: 'neutral', options: [
      { text: 'Bonjour, un café crème, s\'il vous plaît.', quality: 'good', feedback: '"S\'il vous plaît" — Fransızcada naziklik için zorunlu.' },
      { text: 'Un café, merci.', quality: 'ok', feedback: 'Anlaşılır ama "crème/noir" gibi detay eklersen daha iyi.' },
      { text: 'Donnez-moi un café.', quality: 'awkward', feedback: '"Donnez-moi" emir kipi — garsonla bu ton kaba.', correction: 'Un café, s\'il vous plaît.' },
    ]},
    { id: 'cafe-fr-02', npc_message: 'Vous le prenez sur place ou à emporter ?', npc_mood: 'neutral', options: [
      { text: 'Sur place, s\'il vous plaît.', quality: 'good', feedback: 'Net ve kibar.' },
      { text: 'Ici.', quality: 'ok', feedback: 'Anlaşılır ama "sur place" daha doğal kalıp.', correction: 'Sur place, merci.' },
      { text: 'Je reste.', quality: 'awkward', feedback: '"Kalıyorum" — bu bağlamda garip.', correction: 'Sur place, s\'il vous plaît.' },
    ]},
    { id: 'cafe-fr-03', npc_message: 'Vous voulez quelque chose à manger ? Nous avons des croissants frais.', npc_mood: 'happy', options: [
      { text: 'Oui, un croissant aussi, s\'il vous plaît.', quality: 'good', feedback: 'Doğal kabul.' },
      { text: 'Non, merci.', quality: 'ok', feedback: 'Kibarca ret.' },
      { text: 'Je ne veux pas manger.', quality: 'awkward', feedback: '"Yemek istemiyorum" — kaba.', correction: 'Non, merci, juste le café.' },
    ]},
    { id: 'cafe-fr-04', npc_message: 'Vous réglez comment ? Carte ou espèces ?', npc_mood: 'neutral', options: [
      { text: 'Par carte, s\'il vous plaît.', quality: 'good', feedback: 'Net ve standart.' },
      { text: 'Carte.', quality: 'ok', feedback: 'Anlaşılır ama kısa.' },
      { text: 'J\'ai les deux.', quality: 'awkward', feedback: 'Seçim yapman lazım.', correction: 'Par carte, merci.' },
    ]},
    { id: 'cafe-fr-05', npc_message: 'Il y a cinq minutes d\'attente, ça vous va ?', npc_mood: 'neutral', options: [
      { text: 'Bien sûr, pas de problème.', quality: 'good', feedback: '"Pas de problème" — Fransızcada doğal onay.' },
      { text: 'D\'accord.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Cinq minutes c\'est long.', quality: 'awkward', feedback: 'Şikayet tonu gereksiz.', correction: 'Pas de souci, je patiente.' },
    ]},
    { id: 'cafe-fr-06', npc_message: 'Vous préférez vous asseoir en salle ou en terrasse ?', npc_mood: 'happy', options: [
      { text: 'En terrasse, s\'il vous plaît, s\'il y a de la place.', quality: 'good', feedback: '"S\'il y a de la place" — kibar ön koşul.' },
      { text: 'Dehors, merci.', quality: 'ok', feedback: 'Anlaşılır.' },
      { text: 'Je veux être seul.', quality: 'awkward', feedback: 'Soruya cevap vermiyor.', correction: 'En terrasse, si possible.' },
    ]},
    { id: 'cafe-fr-07', npc_message: 'Désolé, nous n\'avons plus de café crème. Un noisette, ça vous convient ?', npc_mood: 'confused', options: [
      { text: 'Oui, un noisette, c\'est parfait, merci.', quality: 'good', feedback: 'Esnek ve kibar kabul.' },
      { text: 'D\'accord.', quality: 'ok', feedback: 'Yeterli ama biraz soğuk.' },
      { text: 'C\'est quoi un noisette ?', quality: 'awkward', feedback: 'Dürüst ama garsonla garip bir diyalog.', correction: 'Oui, sans problème, merci.' },
    ]},
    { id: 'cafe-fr-08', npc_message: 'Voici votre commande. Ça fait quatre euros cinquante.', npc_mood: 'neutral', options: [
      { text: 'Voilà, merci beaucoup.', quality: 'good', feedback: '"Voilà" — ödeme yaparken standart Fransızca.' },
      { text: 'Merci.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'C\'est cher.', quality: 'awkward', feedback: 'Kafede fiyat şikayeti garip.', correction: 'Voilà, merci.' },
    ]},
    { id: 'cafe-fr-09', npc_message: 'Vous voulez un verre d\'eau ? C\'est offert.', npc_mood: 'happy', options: [
      { text: 'Oui, volontiers, merci beaucoup.', quality: 'good', feedback: '"Volontiers" — Fransızcada sıcak kabul ifadesi.' },
      { text: 'Oui, merci.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Je n\'ai pas besoin d\'eau.', quality: 'awkward', feedback: 'Kaba ret.', correction: 'Non, merci, c\'est gentil.' },
    ]},
    { id: 'cafe-fr-10', npc_message: 'Vous avez besoin du mot de passe wifi ?', npc_mood: 'neutral', options: [
      { text: 'Oui, s\'il vous plaît, ce serait sympa.', quality: 'good', feedback: '"Ce serait sympa" — Fransızcada kibar rica.' },
      { text: 'Oui, s\'il vous plaît.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Donnez-moi le wifi.', quality: 'awkward', feedback: 'Emir kipi — kaba.', correction: 'Oui, s\'il vous plaît.' },
    ]},
    { id: 'cafe-fr-11', npc_message: 'Vous avez l\'air de bien apprécier. Vous venez souvent dans le quartier ?', npc_mood: 'happy', options: [
      { text: 'C\'est ma première fois ici, mais j\'adore l\'ambiance.', quality: 'good', feedback: 'Kişisel yorum + iltifat — sohbet açıyor.' },
      { text: 'Oui, parfois.', quality: 'ok', feedback: 'Yeterli ama ilgisiz.' },
      { text: 'Non, je ne connais pas Paris.', quality: 'awkward', feedback: 'Soruya aşırı geniş cevap.', correction: 'C\'est ma première visite, j\'aime bien.' },
    ]},
    { id: 'cafe-fr-12', npc_message: 'Bonne journée ! À bientôt peut-être.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Merci, bonne journée à vous aussi !', quality: 'good', feedback: '"À vous aussi" — Fransızca vedalaşmada standart karşılık.' },
      { text: 'Merci, au revoir.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Bye.', quality: 'awkward', feedback: 'İngilizce kullanmak Fransız kafesinde tuhaf.', correction: 'Merci, bonne journée !' },
    ]},
  ],
};

// ─── Travel · French ─────────────────────────────────────────────────────────

const travelFr: ScenarioDialogue = {
  stageType: 'travel',
  language: 'fr',
  sessionSize: 5,
  turns: [
    { id: 'travel-fr-01', npc_message: 'Bonjour, je vous aide ?', npc_mood: 'neutral', options: [
      { text: 'Oui, merci. Je cherche le métro direction Châtelet.', quality: 'good', feedback: '"Direction Châtelet" — metro yönü sormak için standart ifade.' },
      { text: 'Oui, le métro.', quality: 'ok', feedback: 'Eksik bilgi, nereye gittiğini söyle.' },
      { text: 'Je suis perdu.', quality: 'awkward', feedback: '"Kayboldum" — pratik değil, nereye gideceğini söyle.', correction: 'Je cherche le métro, s\'il vous plaît.' },
    ]},
    { id: 'travel-fr-02', npc_message: 'Vous avez un carnet de tickets ou vous en achetez un ?', npc_mood: 'neutral', options: [
      { text: 'Je voudrais acheter un carnet, s\'il vous plaît.', quality: 'good', feedback: '"Je voudrais" — kibar istek formu.' },
      { text: 'Un ticket, merci.', quality: 'ok', feedback: 'Anlaşılır ama carnet daha ekonomik.' },
      { text: 'Combien ça coûte ?', quality: 'awkward', feedback: 'Soruya cevap vermeden fiyat sordu.', correction: 'Je prends un ticket simple, s\'il vous plaît.' },
    ]},
    { id: 'travel-fr-03', npc_message: 'Vous descendez à quelle station ?', npc_mood: 'neutral', options: [
      { text: 'À Châtelet-Les Halles, s\'il vous plaît.', quality: 'good', feedback: 'Net ve kibar.' },
      { text: 'Châtelet.', quality: 'ok', feedback: 'Anlaşılır ama "s\'il vous plaît" ekle.' },
      { text: 'Je ne sais pas exactement.', quality: 'awkward', feedback: 'Bilet almak için durağı bilmen lazım.', correction: 'À Châtelet, merci.' },
    ]},
    { id: 'travel-fr-04', npc_message: 'Il y a une correspondance à Opéra, ligne trois.', npc_mood: 'neutral', options: [
      { text: 'D\'accord, je prends la ligne trois à Opéra. Merci.', quality: 'good', feedback: 'Bilgiyi teyit etmek — doğru anlama testi.' },
      { text: 'Merci.', quality: 'ok', feedback: 'Yeterli ama tekrar etmek iyi olurdu.' },
      { text: 'C\'est compliqué.', quality: 'awkward', feedback: '"Karmaşık" — bilgiyi reddetmek gibi görünüyor.', correction: 'D\'accord, merci de l\'information.' },
    ]},
    { id: 'travel-fr-05', npc_message: 'Attention, la ligne est interrompue ce soir pour travaux.', npc_mood: 'impatient', options: [
      { text: 'Ah bon ? Quelle est l\'alternative, s\'il vous plaît ?', quality: 'good', feedback: '"Quelle est l\'alternative ?" — pratik çözüm arıyor.' },
      { text: 'D\'accord.', quality: 'ok', feedback: 'Kabul etti ama alternatif sormadı.' },
      { text: 'Encore des travaux !', quality: 'awkward', feedback: 'Şikayet — Paris metrosunda yaygın durum, negatif ton yardım etmez.', correction: 'Y a-t-il un bus de remplacement ?' },
    ]},
    { id: 'travel-fr-06', npc_message: 'Le bus de remplacement part devant la station dans dix minutes.', npc_mood: 'neutral', options: [
      { text: 'Merci beaucoup, je vais y aller tout de suite.', quality: 'good', feedback: 'Teşekkür + hemen harekete geçme — akıcı kapanış.' },
      { text: 'D\'accord, merci.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Dix minutes c\'est long.', quality: 'awkward', feedback: 'Şikayet — beklemek zorundasın.', correction: 'Merci, je vais l\'attraper.' },
    ]},
    { id: 'travel-fr-07', npc_message: 'Vous avez besoin d\'aide avec votre valise ?', npc_mood: 'happy', options: [
      { text: 'Oui, volontiers, merci c\'est très gentil.', quality: 'good', feedback: '"C\'est très gentil" — yardım kabulünde sıcak ifade.' },
      { text: 'Non, ça va, merci.', quality: 'ok', feedback: 'Kibarca ret.' },
      { text: 'Elle est lourde.', quality: 'awkward', feedback: '"Ağır" — soruyu cevaplamıyor.', correction: 'Oui, s\'il vous plaît, merci.' },
    ]},
    { id: 'travel-fr-08', npc_message: 'Votre ticket n\'est pas valide sur cette ligne.', npc_mood: 'impatient', options: [
      { text: 'Oh pardon, qu\'est-ce que je dois faire ?', quality: 'good', feedback: 'Özür + çözüm istemek — doğru tepki.' },
      { text: 'Ah bon ?', quality: 'ok', feedback: 'Tepkisiz — ne yapacağını sorman lazım.' },
      { text: 'Mais si, c\'est valide !', quality: 'awkward', feedback: 'Görevliyle tartışmak problemi çözmez.', correction: 'Pardon, comment je régularise ?' },
    ]},
    { id: 'travel-fr-09', npc_message: 'Le prochain train part dans deux minutes, quai B.', npc_mood: 'neutral', options: [
      { text: 'Merci, je file au quai B.', quality: 'good', feedback: '"Je file" — hızlıca gitme için doğal ifade.' },
      { text: 'Merci, quai B.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Deux minutes, c\'est juste.', quality: 'awkward', feedback: 'Zaman daralsa da şikayet değil harekete geç.', correction: 'Merci, j\'y vais tout de suite !' },
    ]},
    { id: 'travel-fr-10', npc_message: 'Vous connaissez Paris ?', npc_mood: 'happy', options: [
      { text: 'Un peu, c\'est ma deuxième visite. J\'adore cette ville.', quality: 'good', feedback: 'Kişisel bilgi + iltifat — sohbeti sıcak tutuyor.' },
      { text: 'Non, pas vraiment.', quality: 'ok', feedback: 'Dürüst.' },
      { text: 'Je suis touriste.', quality: 'awkward', feedback: '"Turistim" — soru "Paris\'i biliyor musun?" idi.', correction: 'Un peu, je suis en visite.' },
    ]},
    { id: 'travel-fr-11', npc_message: 'N\'oubliez pas de composter votre ticket.', npc_mood: 'neutral', options: [
      { text: 'Ah oui, merci du rappel !', quality: 'good', feedback: '"Merci du rappel" — hatırlatma için teşekkür etmek nazik.' },
      { text: 'D\'accord, merci.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Je sais.', quality: 'awkward', feedback: '"Biliyorum" — biraz kaba duyuluyor.', correction: 'Ah oui, merci !' },
    ]},
    { id: 'travel-fr-12', npc_message: 'Bon voyage ! Profitez bien de Paris.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Merci beaucoup, vous êtes très aimable !', quality: 'good', feedback: '"Vous êtes très aimable" — Fransızca vedada sıcak kapanış.' },
      { text: 'Merci, au revoir.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ok, bye.', quality: 'awkward', feedback: 'İngilizce bitiş Fransız bağlamda garip.', correction: 'Merci, bonne journée !' },
    ]},
  ],
};

// ─── Social · French ─────────────────────────────────────────────────────────

const socialFr: ScenarioDialogue = {
  stageType: 'social',
  language: 'fr',
  sessionSize: 5,
  turns: [
    { id: 'social-fr-01', npc_message: 'Salut ! C\'est la première fois que tu viens ici ?', npc_mood: 'happy', options: [
      { text: 'Oui, des amis me l\'ont recommandé. Et toi, tu viens souvent ?', quality: 'good', feedback: 'Cevap + karşı soru — sohbeti sürdürüyor.' },
      { text: 'Oui, première fois.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Je ne connais personne ici.', quality: 'awkward', feedback: 'Olumsuz açılış.', correction: 'Oui, je suis venu avec des amis.' },
    ]},
    { id: 'social-fr-02', npc_message: 'Tu viens d\'où ?', npc_mood: 'happy', options: [
      { text: 'Je viens de Turquie, d\'Istanbul. Et toi ?', quality: 'good', feedback: 'Cevap + karşı soru.' },
      { text: 'De Turquie.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Je suis étranger.', quality: 'awkward', feedback: 'Soruya cevap vermiyor.', correction: 'Je suis turc, d\'Istanbul. Et toi ?' },
    ]},
    { id: 'social-fr-03', npc_message: 'Qu\'est-ce que tu fais dans la vie ?', npc_mood: 'happy', options: [
      { text: 'Je travaille dans la tech. Et toi ?', quality: 'good', feedback: 'Kısa + karşı soru.' },
      { text: 'Je suis ingénieur.', quality: 'ok', feedback: 'Doğru ama konuşmayı ilerletmiyor.' },
      { text: 'Je travaille beaucoup.', quality: 'awkward', feedback: 'Cevap değil.', correction: 'Je travaille dans l\'informatique, et toi ?' },
    ]},
    { id: 'social-fr-04', npc_message: 'Qu\'est-ce que tu penses de la soirée ?', npc_mood: 'happy', options: [
      { text: 'C\'est super, j\'adore l\'ambiance ! Tu connais les gens ici ?', quality: 'good', feedback: 'İltifat + soru — sohbet devam ediyor.' },
      { text: 'C\'est bien.', quality: 'ok', feedback: 'Yeterli ama ilgisiz.' },
      { text: 'Je ne comprends pas cette musique.', quality: 'awkward', feedback: 'Sosyal ortamda negatif yorum.', correction: 'C\'est sympa, j\'aime bien l\'ambiance.' },
    ]},
    { id: 'social-fr-05', npc_message: 'Tu veux boire quelque chose ? Je t\'invite.', npc_mood: 'happy', options: [
      { text: 'C\'est sympa, une bière ce serait parfait, merci !', quality: 'good', feedback: '"C\'est sympa" — teklifi kabul ederken sıcak.' },
      { text: 'Oui, merci.', quality: 'ok', feedback: 'Yeterli ama ne istediğini söylemedin.' },
      { text: 'Non, j\'ai déjà à boire.', quality: 'awkward', feedback: 'Sert ret.', correction: 'Non merci, c\'est gentil mais j\'ai déjà quelque chose.' },
    ]},
    { id: 'social-fr-06', npc_message: 'Depuis combien de temps tu es en France ?', npc_mood: 'happy', options: [
      { text: 'Trois mois. J\'apprends encore le français !', quality: 'good', feedback: 'Kişisel bilgi + alçakgönüllülük.' },
      { text: 'Trois mois.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Pas longtemps.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'Quelques mois, je m\'adapte encore.' },
    ]},
    { id: 'social-fr-07', npc_message: 'Tu connais un bon restaurant dans le coin ?', npc_mood: 'happy', options: [
      { text: 'Pas encore, je suis nouveau. Tu aurais une suggestion ?', quality: 'good', feedback: 'Bilmediğini kabul + öneri istemek.' },
      { text: 'Non, je ne sais pas.', quality: 'ok', feedback: 'Dürüst ama fırsatı kaçırıyor.' },
      { text: 'Je ne connais pas Paris.', quality: 'awkward', feedback: 'Konuşmayı bitiriyor.', correction: 'Non, tu me conseilles quelque chose ?' },
    ]},
    { id: 'social-fr-08', npc_message: 'On danse ?', npc_mood: 'happy', options: [
      { text: 'Pourquoi pas, allons-y !', quality: 'good', feedback: '"Pourquoi pas" — Fransızcada dans teklifini kabul için enerjik.' },
      { text: 'Je ne sais pas danser.', quality: 'ok', feedback: 'Dürüst ret.' },
      { text: 'Je suis fatigué.', quality: 'awkward', feedback: 'Partide yorgunluk soğuk.', correction: 'Pas vraiment, mais j\'essaie !' },
    ]},
    { id: 'social-fr-09', npc_message: 'Je te présente mon ami Thomas.', npc_mood: 'happy', options: [
      { text: 'Salut Thomas, enchanté ! Tu es aussi de Paris ?', quality: 'good', feedback: 'Selamlama + soru — tanışmayı sohbete çeviriyor.' },
      { text: 'Salut, enchanté.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Salut.', quality: 'awkward', feedback: 'Çok kısa.', correction: 'Salut Thomas, ravi de te rencontrer.' },
    ]},
    { id: 'social-fr-10', npc_message: 'Tu es sur Instagram ? On pourrait se suivre.', npc_mood: 'happy', options: [
      { text: 'Oui, bien sûr ! Je te cherche maintenant.', quality: 'good', feedback: 'Sıcak kabul.' },
      { text: 'Oui, @nom.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Je ne l\'utilise pas trop.', quality: 'awkward', feedback: 'Belirsiz cevap.', correction: 'Oui, je t\'envoie une demande.' },
    ]},
    { id: 'social-fr-11', npc_message: 'Quels sont tes plans pour ce week-end ?', npc_mood: 'happy', options: [
      { text: 'Je veux explorer le quartier. Tu as des plans, toi ?', quality: 'good', feedback: 'Cevap + karşı soru.' },
      { text: 'Je ne sais pas encore.', quality: 'ok', feedback: 'Dürüst ama devam etmiyor.' },
      { text: 'Dormir probablement.', quality: 'awkward', feedback: 'Yeni bir arkadaşa negatif mesaj.', correction: 'Pas encore, et toi ?' },
    ]},
    { id: 'social-fr-12', npc_message: 'C\'était sympa de te rencontrer ! À bientôt j\'espère.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Pareil ! Ravi de t\'avoir rencontré. À bientôt !', quality: 'good', feedback: 'Sıcak ve karşılıklı kapanış.' },
      { text: 'Merci, à bientôt.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Bye.', quality: 'awkward', feedback: 'İngilizce bitiş garip.', correction: 'Enchanté, à la prochaine !' },
    ]},
  ],
};

// ─── Business · French ───────────────────────────────────────────────────────

const businessFr: ScenarioDialogue = {
  stageType: 'business',
  language: 'fr',
  sessionSize: 5,
  turns: [
    { id: 'biz-fr-01', npc_message: 'Bonjour, vous avez rendez-vous ?', npc_mood: 'neutral', options: [
      { text: 'Oui, j\'ai un rendez-vous avec Madame Dupont à dix heures.', quality: 'good', feedback: 'İsim ve saat — resepsiyon için standart.' },
      { text: 'Oui, un rendez-vous.', quality: 'ok', feedback: 'Eksik bilgi.' },
      { text: 'Je viens pour une réunion.', quality: 'awkward', feedback: 'Kiminle olduğunu belirt.', correction: 'Oui, avec Madame Dupont.' },
    ]},
    { id: 'biz-fr-02', npc_message: 'Quel est l\'objet de votre visite ?', npc_mood: 'neutral', options: [
      { text: 'Je viens présenter notre proposition de partenariat.', quality: 'good', feedback: 'Net ve profesyonel.' },
      { text: 'Pour affaires.', quality: 'ok', feedback: 'Çok genel.' },
      { text: 'Je ne sais pas exactement.', quality: 'awkward', feedback: 'Ziyaretin amacını bilmemek profesyonel değil.', correction: 'Pour présenter une proposition commerciale.' },
    ]},
    { id: 'biz-fr-03', npc_message: 'Enchantée. J\'ai étudié votre dossier et j\'ai quelques questions.', npc_mood: 'neutral', options: [
      { text: 'Enchantée également. Je suis à votre disposition.', quality: 'good', feedback: '"Je suis à votre disposition" — Fransız iş dilinde standart.' },
      { text: 'Enchantée. Allez-y.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Bonjour. Quelles questions ?', quality: 'awkward', feedback: 'Çok gayri resmi.', correction: 'Enchantée, avec plaisir.' },
    ]},
    { id: 'biz-fr-04', npc_message: 'Votre budget semble élevé. Y a-t-il une marge de négociation ?', npc_mood: 'impatient', options: [
      { text: 'Je comprends votre préoccupation. Nous pouvons revoir les conditions ensemble.', quality: 'good', feedback: 'Empati + çözüm odaklı.' },
      { text: 'Oui, on peut discuter.', quality: 'ok', feedback: 'Açık ama zayıf.' },
      { text: 'Le prix est juste.', quality: 'awkward', feedback: 'Savunmaya geçiyor.', correction: 'Nous pouvons trouver un compromis.' },
    ]},
    { id: 'biz-fr-05', npc_message: 'Quand pourriez-vous démarrer si nous nous mettons d\'accord ?', npc_mood: 'neutral', options: [
      { text: 'Nous pourrions démarrer début du mois prochain, si cela vous convient.', quality: 'good', feedback: '"Si cela vous convient" — karşı tarafı sürece dahil ediyor.' },
      { text: 'Le mois prochain.', quality: 'ok', feedback: 'Net ama kısa.' },
      { text: 'Ça dépend.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'Dans deux à trois semaines, si vous êtes d\'accord.' },
    ]},
    { id: 'biz-fr-06', npc_message: 'Nous avons besoin de références de projets similaires.', npc_mood: 'neutral', options: [
      { text: 'Bien sûr, je peux vous envoyer trois références cette semaine.', quality: 'good', feedback: 'Somut taahhüt + zaman çerçevesi.' },
      { text: 'Nous en avons.', quality: 'ok', feedback: 'Belirsiz.' },
      { text: 'Tous nos clients sont satisfaits.', quality: 'awkward', feedback: 'İspatsız iddia.', correction: 'Je vous transmets les références demain.' },
    ]},
    { id: 'biz-fr-07', npc_message: 'Le support technique est-il inclus après la livraison ?', npc_mood: 'neutral', options: [
      { text: 'Oui, nous incluons six mois de support sans frais supplémentaires.', quality: 'good', feedback: 'Net, somut, değer katan.' },
      { text: 'Oui, c\'est inclus.', quality: 'ok', feedback: 'Doğru ama detay eksik.' },
      { text: 'Ça dépend du contrat.', quality: 'awkward', feedback: 'Belirsiz ve güvensiz.', correction: 'Oui, six mois de support inclus.' },
    ]},
    { id: 'biz-fr-08', npc_message: 'Je dois en discuter avec mon équipe avant de décider.', npc_mood: 'neutral', options: [
      { text: 'Bien sûr. Dans quel délai pensez-vous avoir une réponse ?', quality: 'good', feedback: 'Baskısız zaman çerçevesi sorusu.' },
      { text: 'D\'accord.', quality: 'ok', feedback: 'Kabul etti ama ne zaman duyacağını sormadı.' },
      { text: 'J\'espère une décision rapide.', quality: 'awkward', feedback: 'Hafif baskı.', correction: 'Quand puis-je avoir votre retour ?' },
    ]},
    { id: 'biz-fr-09', npc_message: 'Pouvez-vous nous laisser un exemplaire de la proposition ?', npc_mood: 'neutral', options: [
      { text: 'Bien sûr, j\'ai des exemplaires imprimés et je vous envoie aussi la version numérique.', quality: 'good', feedback: 'İki format sunmak.' },
      { text: 'Oui, voilà.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'C\'est dans mon email.', quality: 'awkward', feedback: 'Karşı tarafa zor.', correction: 'Voici un exemplaire imprimé.' },
    ]},
    { id: 'biz-fr-10', npc_message: 'Avez-vous une carte de visite ?', npc_mood: 'neutral', options: [
      { text: 'Oui, la voici. Je peux aussi vous ajouter sur LinkedIn si vous le souhaitez.', quality: 'good', feedback: 'Kart + LinkedIn — networking.' },
      { text: 'Oui, la voici.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Non, mais j\'ai WhatsApp.', quality: 'awkward', feedback: 'Resmi toplantıda WhatsApp uygunsuz.', correction: 'Oui, voici ma carte.' },
    ]},
    { id: 'biz-fr-11', npc_message: 'Nous reviendrons vers vous en début de semaine prochaine.', npc_mood: 'neutral', options: [
      { text: 'Parfait, je reste disponible pour toute question d\'ici là.', quality: 'good', feedback: '"Je reste disponible" — profesyonel kapanış.' },
      { text: 'D\'accord, merci.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'J\'attends votre appel.', quality: 'awkward', feedback: 'Hafif baskı tonu.', correction: 'Je suis à votre disposition, bonne semaine.' },
    ]},
    { id: 'biz-fr-12', npc_message: 'Ça a été un plaisir. À bientôt.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Tout le plaisir était pour moi. Bonne journée !', quality: 'good', feedback: '"Tout le plaisir était pour moi" — Fransız iş dilinde standart kapanış.' },
      { text: 'Merci, au revoir.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ok, bye.', quality: 'awkward', feedback: 'İngilizce ve gayri resmi.', correction: 'Merci, à très bientôt.' },
    ]},
  ],
};

// ─── Registry ────────────────────────────────────────────────────────────────

// ─── Café · German ───────────────────────────────────────────────────────────

const cafeDe: ScenarioDialogue = {
  stageType: 'cafe',
  language: 'de',
  sessionSize: 5,
  turns: [
    { id: 'cafe-de-01', npc_message: 'Guten Morgen! Was darf es sein?', npc_mood: 'happy', options: [
      { text: 'Guten Morgen! Einen Kaffee mit Milch, bitte.', quality: 'good', feedback: '"Bitte" — Almancada her siparişte zorunlu nezaket.' },
      { text: 'Einen Kaffee, danke.', quality: 'ok', feedback: 'Anlaşılır ama "mit Milch" gibi detay ekle.' },
      { text: 'Kaffee.', quality: 'awkward', feedback: 'Tek kelime — çok kısa ve kaba.', correction: 'Einen Kaffee, bitte.' },
    ]},
    { id: 'cafe-de-02', npc_message: 'Groß oder klein?', npc_mood: 'neutral', options: [
      { text: 'Groß, bitte.', quality: 'good', feedback: 'Net ve kibar.' },
      { text: 'Groß.', quality: 'ok', feedback: 'Doğru ama "bitte" eksik.' },
      { text: 'Den größten.', quality: 'awkward', feedback: '"En büyüğü" — garip.', correction: 'Groß, bitte.' },
    ]},
    { id: 'cafe-de-03', npc_message: 'Für hier oder zum Mitnehmen?', npc_mood: 'neutral', options: [
      { text: 'Für hier, danke.', quality: 'good', feedback: 'Standart ifade.' },
      { text: 'Hier.', quality: 'ok', feedback: 'Anlaşılır ama kısa.' },
      { text: 'Ich bleibe.', quality: 'awkward', feedback: '"Kalıyorum" — bu bağlamda tuhaf.', correction: 'Für hier, bitte.' },
    ]},
    { id: 'cafe-de-04', npc_message: 'Möchten Sie auch etwas essen? Wir haben frische Brötchen.', npc_mood: 'happy', options: [
      { text: 'Ja, ein Brötchen auch, bitte.', quality: 'good', feedback: 'Doğal kabul.' },
      { text: 'Nein, danke.', quality: 'ok', feedback: 'Kibarca ret.' },
      { text: 'Ich will nichts essen.', quality: 'awkward', feedback: '"Yemek istemiyorum" — kaba.', correction: 'Nein danke, nur den Kaffee.' },
    ]},
    { id: 'cafe-de-05', npc_message: 'Bezahlen Sie bar oder mit Karte?', npc_mood: 'neutral', options: [
      { text: 'Mit Karte, bitte.', quality: 'good', feedback: 'Net ve standart.' },
      { text: 'Karte.', quality: 'ok', feedback: 'Anlaşılır.' },
      { text: 'Ich habe beides.', quality: 'awkward', feedback: 'Seçim yapman lazım.', correction: 'Mit Karte, bitte.' },
    ]},
    { id: 'cafe-de-06', npc_message: 'Das macht drei Euro fünfzig, bitte.', npc_mood: 'neutral', options: [
      { text: 'Hier, bitte. Danke schön.', quality: 'good', feedback: '"Danke schön" — Almancada ödeme sırasında standart.' },
      { text: 'Bitte.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'So teuer?', quality: 'awkward', feedback: '"Bu kadar mı pahalı?" — gereksiz şikayet.', correction: 'Hier, bitte.' },
    ]},
    { id: 'cafe-de-07', npc_message: 'Drinnen oder draußen sitzen?', npc_mood: 'neutral', options: [
      { text: 'Draußen, bitte, wenn noch Platz ist.', quality: 'good', feedback: '"Wenn noch Platz ist" — kibar ön koşul.' },
      { text: 'Draußen.', quality: 'ok', feedback: 'Anlaşılır.' },
      { text: 'Ich will allein sein.', quality: 'awkward', feedback: 'Soruya cevap vermiyor.', correction: 'Draußen, bitte.' },
    ]},
    { id: 'cafe-de-08', npc_message: 'Tut mir leid, der Kaffee mit Milch ist leider aus. Geht ein Cappuccino?', npc_mood: 'confused', options: [
      { text: 'Ja, ein Cappuccino ist prima, danke.', quality: 'good', feedback: '"Prima" — Almancada yaygın onay ifadesi.' },
      { text: 'Okay, danke.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Was ist ein Cappuccino?', quality: 'awkward', feedback: 'Kafede cappuccino bilmemek garip.', correction: 'Ja, gerne, danke.' },
    ]},
    { id: 'cafe-de-09', npc_message: 'Möchten Sie auch ein Glas Wasser? Das geht aufs Haus.', npc_mood: 'happy', options: [
      { text: 'Ja, sehr gerne, vielen Dank!', quality: 'good', feedback: '"Sehr gerne" — sıcak ve olumlu kabul.' },
      { text: 'Ja, danke.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Kein Wasser nötig.', quality: 'awkward', feedback: 'Kaba ret.', correction: 'Nein danke, aber trotzdem nett.' },
    ]},
    { id: 'cafe-de-10', npc_message: 'Brauchen Sie das WLAN-Passwort?', npc_mood: 'neutral', options: [
      { text: 'Ja, bitte, das wäre super.', quality: 'good', feedback: '"Das wäre super" — kibar rica.' },
      { text: 'Ja, bitte.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Geben Sie mir das Passwort.', quality: 'awkward', feedback: 'Emir kipi — kaba.', correction: 'Ja, wenn möglich, bitte.' },
    ]},
    { id: 'cafe-de-11', npc_message: 'Kommen Sie öfter hier her?', npc_mood: 'happy', options: [
      { text: 'Nein, es ist mein erstes Mal. Aber es gefällt mir sehr gut hier.', quality: 'good', feedback: 'Kişisel bilgi + iltifat — sohbet açıyor.' },
      { text: 'Nein, zum ersten Mal.', quality: 'ok', feedback: 'Doğru.' },
      { text: 'Ich kenne Berlin nicht gut.', quality: 'awkward', feedback: 'Soruya aşırı geniş cevap.', correction: 'Erstes Mal, aber es gefällt mir!' },
    ]},
    { id: 'cafe-de-12', npc_message: 'Schönen Tag noch! Bis zum nächsten Mal.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Danke, Ihnen auch! Auf Wiedersehen.', quality: 'good', feedback: '"Auf Wiedersehen" — Almancada resmi veda.' },
      { text: 'Danke, tschüss.', quality: 'ok', feedback: 'Yeterli, biraz gayri resmi.' },
      { text: 'Bye.', quality: 'awkward', feedback: 'İngilizce veda Alman kafesinde garip.', correction: 'Danke, auf Wiedersehen!' },
    ]},
  ],
};

// ─── Travel · German ─────────────────────────────────────────────────────────

const travelDe: ScenarioDialogue = {
  stageType: 'travel',
  language: 'de',
  sessionSize: 5,
  turns: [
    { id: 'travel-de-01', npc_message: 'Guten Tag! Kann ich Ihnen helfen?', npc_mood: 'neutral', options: [
      { text: 'Ja, danke. Ich suche den U-Bahnhof Alexanderplatz.', quality: 'good', feedback: '"Ich suche" — yön bulmak için standart ifade.' },
      { text: 'Ja, die U-Bahn.', quality: 'ok', feedback: 'Eksik bilgi.' },
      { text: 'Ich bin verloren.', quality: 'awkward', feedback: '"Kayboldum" yerine nereye gittiğini söyle.', correction: 'Ich suche den Alexanderplatz, bitte.' },
    ]},
    { id: 'travel-de-02', npc_message: 'Haben Sie eine Fahrkarte oder brauchen Sie eine?', npc_mood: 'neutral', options: [
      { text: 'Ich brauche eine Einzelfahrkarte, bitte.', quality: 'good', feedback: '"Einzelfahrkarte" — tek yön bilet için doğru kelime.' },
      { text: 'Eine Fahrkarte, bitte.', quality: 'ok', feedback: 'Anlaşılır.' },
      { text: 'Wie viel kostet das?', quality: 'awkward', feedback: 'Soruya cevap vermeden fiyat sordu.', correction: 'Eine Einzelfahrkarte, bitte.' },
    ]},
    { id: 'travel-de-03', npc_message: 'Sie müssen an der nächsten Station umsteigen, Linie zwei.', npc_mood: 'neutral', options: [
      { text: 'Verstanden. Linie zwei an der nächsten Station, danke.', quality: 'good', feedback: 'Bilgiyi tekrar etmek — doğru anlama testi.' },
      { text: 'Okay, danke.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Das ist kompliziert.', quality: 'awkward', feedback: '"Karmaşık" — bilgiyi reddetmek gibi.', correction: 'Alright, nächste Station umsteigen, danke.' },
    ]},
    { id: 'travel-de-04', npc_message: 'Wegen Bauarbeiten fährt die U-Bahn heute nicht bis zur Endstation.', npc_mood: 'impatient', options: [
      { text: 'Ah, verstehe. Gibt es eine alternative Route?', quality: 'good', feedback: 'Durumu kabul edip alternatif arıyor.' },
      { text: 'Oh, okay.', quality: 'ok', feedback: 'Kabul etti ama ne yapacağını sormadı.' },
      { text: 'Schon wieder Baustellen!', quality: 'awkward', feedback: 'Şikayet yardım etmez.', correction: 'Welche Alternative gibt es?' },
    ]},
    { id: 'travel-de-05', npc_message: 'Der Ersatzbus hält direkt vor dem Eingang.', npc_mood: 'neutral', options: [
      { text: 'Danke sehr, ich gehe gleich hin.', quality: 'good', feedback: 'Teşekkür + harekete geçme.' },
      { text: 'Danke.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Der Bus ist langsam.', quality: 'awkward', feedback: 'Şikayet — otobüs en iyi alternatif.', correction: 'Vielen Dank, ich fahre mit dem Bus.' },
    ]},
    { id: 'travel-de-06', npc_message: 'Darf ich Ihnen mit dem Gepäck helfen?', npc_mood: 'happy', options: [
      { text: 'Ja, gerne, das ist sehr nett von Ihnen.', quality: 'good', feedback: '"Das ist sehr nett von Ihnen" — yardım kabulünde sıcak.' },
      { text: 'Nein danke, ich komme schon klar.', quality: 'ok', feedback: 'Kibarca ret.' },
      { text: 'Es ist sehr schwer.', quality: 'awkward', feedback: 'Soruya cevap vermiyor.', correction: 'Ja, bitte, danke schön.' },
    ]},
    { id: 'travel-de-07', npc_message: 'Ihr Ticket ist auf dieser Linie nicht gültig.', npc_mood: 'impatient', options: [
      { text: 'Entschuldigung, was muss ich tun?', quality: 'good', feedback: 'Özür + çözüm istemek.' },
      { text: 'Oh, wirklich?', quality: 'ok', feedback: 'Tepkisiz — ne yapacağını sor.' },
      { text: 'Aber ich habe bezahlt!', quality: 'awkward', feedback: 'Görevliyle tartışmak işe yaramaz.', correction: 'Wie kann ich das lösen?' },
    ]},
    { id: 'travel-de-08', npc_message: 'Der nächste Zug fährt in drei Minuten, Gleis vier.', npc_mood: 'neutral', options: [
      { text: 'Danke, ich gehe schnell zu Gleis vier.', quality: 'good', feedback: 'Bilgiyi teyit + harekete geçme.' },
      { text: 'Danke, Gleis vier.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Drei Minuten, das ist knapp.', quality: 'awkward', feedback: 'Şikayet yerine koş.', correction: 'Danke! Ich beeil mich.' },
    ]},
    { id: 'travel-de-09', npc_message: 'Kennen Sie sich in Berlin aus?', npc_mood: 'happy', options: [
      { text: 'Nicht so gut, es ist mein zweiter Besuch. Ich liebe diese Stadt.', quality: 'good', feedback: 'Kişisel bilgi + iltifat.' },
      { text: 'Nicht wirklich.', quality: 'ok', feedback: 'Dürüst.' },
      { text: 'Ich bin Tourist.', quality: 'awkward', feedback: '"Turistim" soruya tam cevap değil.', correction: 'Ein bisschen, ich bin zum zweiten Mal hier.' },
    ]},
    { id: 'travel-de-10', npc_message: 'Vergessen Sie nicht, Ihren Fahrschein zu entwerten.', npc_mood: 'neutral', options: [
      { text: 'Ah, stimmt! Danke für den Hinweis.', quality: 'good', feedback: '"Danke für den Hinweis" — hatırlatma için teşekkür.' },
      { text: 'Ja, danke.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ich weiß.', quality: 'awkward', feedback: '"Biliyorum" — kaba.', correction: 'Ah ja, danke!' },
    ]},
    { id: 'travel-de-11', npc_message: 'Haben Sie noch Fragen?', npc_mood: 'neutral', options: [
      { text: 'Nein, ich glaube, ich habe alles verstanden. Vielen Dank!', quality: 'good', feedback: 'Net kapanış ve teşekkür.' },
      { text: 'Nein, danke.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Vielleicht.', quality: 'awkward', feedback: '"Belki" — belirsiz ve yardımcıyı asıyor.', correction: 'Nein, alles klar, danke.' },
    ]},
    { id: 'travel-de-12', npc_message: 'Gute Reise! Genießen Sie Berlin.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Danke, Ihnen auch einen schönen Tag!', quality: 'good', feedback: 'Sıcak karşılıklı kapanış.' },
      { text: 'Danke, auf Wiedersehen.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Bye.', quality: 'awkward', feedback: 'İngilizce garip.', correction: 'Danke sehr, auf Wiedersehen!' },
    ]},
  ],
};

// ─── Business · German ───────────────────────────────────────────────────────

const businessDe: ScenarioDialogue = {
  stageType: 'business',
  language: 'de',
  sessionSize: 5,
  turns: [
    { id: 'biz-de-01', npc_message: 'Guten Morgen, haben Sie einen Termin?', npc_mood: 'neutral', options: [
      { text: 'Ja, ich habe einen Termin mit Herrn Müller um zehn Uhr.', quality: 'good', feedback: 'İsim ve saat — Alman iş kültüründe dakiklik çok önemli.' },
      { text: 'Ja, ich habe einen Termin.', quality: 'ok', feedback: 'Eksik bilgi.' },
      { text: 'Ich komme für ein Meeting.', quality: 'awkward', feedback: 'İngilizce "meeting" — "Besprechung" daha uygun.', correction: 'Ja, eine Besprechung mit Herrn Müller.' },
    ]},
    { id: 'biz-de-02', npc_message: 'Was ist der Zweck Ihres Besuchs?', npc_mood: 'neutral', options: [
      { text: 'Ich komme, um unser Kooperationsangebot vorzustellen.', quality: 'good', feedback: 'Net ve profesyonel.' },
      { text: 'Für Geschäfte.', quality: 'ok', feedback: 'Çok genel.' },
      { text: 'Ich weiß es nicht genau.', quality: 'awkward', feedback: 'Ziyaretin amacını bilmemek profesyonel değil.', correction: 'Ich möchte ein Angebot präsentieren.' },
    ]},
    { id: 'biz-de-03', npc_message: 'Sehr erfreut. Ich habe Ihr Angebot durchgesehen und habe einige Fragen.', npc_mood: 'neutral', options: [
      { text: 'Ebenfalls, ich stehe Ihnen gerne zur Verfügung.', quality: 'good', feedback: '"Zur Verfügung stehen" — Alman iş dilinde standart.' },
      { text: 'Freut mich. Bitte.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Hallo. Was für Fragen?', quality: 'awkward', feedback: 'Çok gayri resmi.', correction: 'Sehr erfreut, gerne beantworte ich Ihre Fragen.' },
    ]},
    { id: 'biz-de-04', npc_message: 'Das Budget erscheint hoch. Gibt es Verhandlungsspielraum?', npc_mood: 'impatient', options: [
      { text: 'Ich verstehe Ihre Bedenken. Wir können die Konditionen gemeinsam prüfen.', quality: 'good', feedback: 'Empati + çözüm odaklı.' },
      { text: 'Ja, wir können reden.', quality: 'ok', feedback: 'Açık ama zayıf.' },
      { text: 'Der Preis ist fair.', quality: 'awkward', feedback: 'Savunmaya geçiyor.', correction: 'Wir können eine Lösung finden.' },
    ]},
    { id: 'biz-de-05', npc_message: 'Wann könnten Sie anfangen, wenn wir uns einigen?', npc_mood: 'neutral', options: [
      { text: 'Wir könnten Anfang nächsten Monats beginnen, wenn es Ihnen passt.', quality: 'good', feedback: '"Wenn es Ihnen passt" — karşı tarafı sürece dahil ediyor.' },
      { text: 'Nächsten Monat.', quality: 'ok', feedback: 'Net ama kısa.' },
      { text: 'Das hängt ab.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'In zwei bis drei Wochen, wenn Sie einverstanden sind.' },
    ]},
    { id: 'biz-de-06', npc_message: 'Wir benötigen Referenzen ähnlicher Projekte.', npc_mood: 'neutral', options: [
      { text: 'Selbstverständlich, ich kann Ihnen diese Woche drei Referenzen schicken.', quality: 'good', feedback: 'Somut taahhüt + zaman çerçevesi.' },
      { text: 'Wir haben Referenzen.', quality: 'ok', feedback: 'Belirsiz.' },
      { text: 'Alle unsere Kunden sind zufrieden.', quality: 'awkward', feedback: 'İspatsız iddia.', correction: 'Ich sende Ihnen die Referenzen morgen zu.' },
    ]},
    { id: 'biz-de-07', npc_message: 'Ist technischer Support nach der Lieferung inbegriffen?', npc_mood: 'neutral', options: [
      { text: 'Ja, wir bieten sechs Monate Support ohne zusätzliche Kosten.', quality: 'good', feedback: 'Net, somut.' },
      { text: 'Ja, ist dabei.', quality: 'ok', feedback: 'Doğru ama detay eksik.' },
      { text: 'Das kommt auf den Vertrag an.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'Ja, sechs Monate inklusive.' },
    ]},
    { id: 'biz-de-08', npc_message: 'Ich muss das vorher mit meinem Team besprechen.', npc_mood: 'neutral', options: [
      { text: 'Natürlich. Bis wann können wir mit einer Antwort rechnen?', quality: 'good', feedback: 'Baskısız zaman çerçevesi sorusu.' },
      { text: 'Okay.', quality: 'ok', feedback: 'Kabul etti ama ne zaman duyacağını sormadı.' },
      { text: 'Ich hoffe auf eine schnelle Entscheidung.', quality: 'awkward', feedback: 'Hafif baskı.', correction: 'Wann darf ich mit einer Rückmeldung rechnen?' },
    ]},
    { id: 'biz-de-09', npc_message: 'Können Sie uns ein Exemplar des Angebots dalassen?', npc_mood: 'neutral', options: [
      { text: 'Natürlich, ich habe ausgedruckte Exemplare und schicke Ihnen auch die digitale Version.', quality: 'good', feedback: 'İki format — hazırlıklı.' },
      { text: 'Ja, hier bitte.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Es ist in meiner E-Mail.', quality: 'awkward', feedback: 'Karşı tarafa zor.', correction: 'Hier ist ein gedrucktes Exemplar.' },
    ]},
    { id: 'biz-de-10', npc_message: 'Haben Sie eine Visitenkarte?', npc_mood: 'neutral', options: [
      { text: 'Ja, hier bitte. Ich kann Sie auch auf LinkedIn hinzufügen, wenn Sie möchten.', quality: 'good', feedback: 'Kart + LinkedIn.' },
      { text: 'Ja, bitte sehr.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Nein, aber ich habe WhatsApp.', quality: 'awkward', feedback: 'Resmi toplantıda WhatsApp uygunsuz.', correction: 'Ja, hier ist meine Karte.' },
    ]},
    { id: 'biz-de-11', npc_message: 'Wir melden uns Anfang nächster Woche bei Ihnen.', npc_mood: 'neutral', options: [
      { text: 'Gut, ich stehe bis dahin für Fragen zur Verfügung.', quality: 'good', feedback: '"Zur Verfügung stehen" — profesyonel kapanış.' },
      { text: 'In Ordnung, danke.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ich warte auf Ihren Anruf.', quality: 'awkward', feedback: 'Hafif baskı.', correction: 'Gerne, ich freue mich auf Ihre Rückmeldung.' },
    ]},
    { id: 'biz-de-12', npc_message: 'Es war ein Vergnügen. Auf Wiedersehen.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Ganz meinerseits. Ich wünsche Ihnen einen schönen Tag!', quality: 'good', feedback: '"Ganz meinerseits" — Alman iş dilinde standart kapanış.' },
      { text: 'Danke, auf Wiedersehen.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Bye, tschüss.', quality: 'awkward', feedback: 'İngilizce+Almanca karışık.', correction: 'Auf Wiedersehen, vielen Dank!' },
    ]},
  ],
};

// ─── Social · German ─────────────────────────────────────────────────────────

const socialDe: ScenarioDialogue = {
  stageType: 'social',
  language: 'de',
  sessionSize: 5,
  turns: [
    { id: 'social-de-01', npc_message: 'Hey! Bist du zum ersten Mal hier?', npc_mood: 'happy', options: [
      { text: 'Ja, Freunde haben es mir empfohlen. Kommst du öfter?', quality: 'good', feedback: 'Cevap + karşı soru.' },
      { text: 'Ja, erstes Mal.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Ich kenne hier niemanden.', quality: 'awkward', feedback: 'Olumsuz açılış.', correction: 'Ja, ein Freund hat es empfohlen.' },
    ]},
    { id: 'social-de-02', npc_message: 'Woher kommst du?', npc_mood: 'happy', options: [
      { text: 'Aus der Türkei, aus Istanbul. Und du?', quality: 'good', feedback: 'Cevap + karşı soru.' },
      { text: 'Aus der Türkei.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Ich bin Ausländer.', quality: 'awkward', feedback: 'Soruya cevap vermiyor.', correction: 'Aus Istanbul, und du?' },
    ]},
    { id: 'social-de-03', npc_message: 'Was machst du beruflich?', npc_mood: 'happy', options: [
      { text: 'Ich arbeite in der IT. Und du?', quality: 'good', feedback: 'Kısa + karşı soru.' },
      { text: 'Ich bin Ingenieur.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Ich arbeite viel.', quality: 'awkward', feedback: 'Cevap değil.', correction: 'Ich bin in der Technik tätig, und du?' },
    ]},
    { id: 'social-de-04', npc_message: 'Was hältst du von der Party?', npc_mood: 'happy', options: [
      { text: 'Super, tolle Atmosphäre! Kennst du die Leute hier?', quality: 'good', feedback: 'İltifat + soru.' },
      { text: 'Ganz gut.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ich verstehe diese Musik nicht.', quality: 'awkward', feedback: 'Sosyal ortamda negatif yorum.', correction: 'Mir gefällt es hier, und dir?' },
    ]},
    { id: 'social-de-05', npc_message: 'Kann ich dir etwas zu trinken anbieten?', npc_mood: 'happy', options: [
      { text: 'Sehr gerne, ein Bier wäre toll, danke!', quality: 'good', feedback: '"Sehr gerne" — sıcak kabul.' },
      { text: 'Ja, danke.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ich habe schon was.', quality: 'awkward', feedback: 'Sert ret.', correction: 'Nein danke, ich hab schon was, aber nett von dir.' },
    ]},
    { id: 'social-de-06', npc_message: 'Wie lange bist du schon in Deutschland?', npc_mood: 'happy', options: [
      { text: 'Drei Monate. Ich lerne noch Deutsch!', quality: 'good', feedback: 'Kişisel bilgi + alçakgönüllülük.' },
      { text: 'Drei Monate.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Nicht lange.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'Ein paar Monate, ich lerne noch die Sprache.' },
    ]},
    { id: 'social-de-07', npc_message: 'Kennst du ein gutes Restaurant in der Nähe?', npc_mood: 'happy', options: [
      { text: 'Noch nicht so gut, ich bin neu. Hast du eine Empfehlung?', quality: 'good', feedback: 'Bilmediğini kabul + öneri istemek.' },
      { text: 'Nein, weiß ich nicht.', quality: 'ok', feedback: 'Dürüst ama fırsatı kaçırıyor.' },
      { text: 'Ich kenne Berlin nicht.', quality: 'awkward', feedback: 'Konuşmayı bitiriyor.', correction: 'Nicht wirklich, hast du eine Empfehlung?' },
    ]},
    { id: 'social-de-08', npc_message: 'Tanzt du?', npc_mood: 'happy', options: [
      { text: 'Ein bisschen, aber ich mach mit. Los!', quality: 'good', feedback: '"Ich mach mit" — katılmak için doğal Almanca.' },
      { text: 'Ich kann nicht tanzen.', quality: 'ok', feedback: 'Dürüst ret.' },
      { text: 'Ich bin müde.', quality: 'awkward', feedback: 'Partide yorgunluk bahanesi soğuk.', correction: 'Nicht so gut, aber ich versuche es!' },
    ]},
    { id: 'social-de-09', npc_message: 'Darf ich dich meinem Freund Jonas vorstellen?', npc_mood: 'happy', options: [
      { text: 'Hallo Jonas, freut mich! Bist du auch aus Berlin?', quality: 'good', feedback: 'Selamlama + soru.' },
      { text: 'Hallo, freut mich.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Hallo.', quality: 'awkward', feedback: 'Çok kısa.', correction: 'Hi Jonas, schön dich kennenzulernen.' },
    ]},
    { id: 'social-de-10', npc_message: 'Bist du auf Instagram? Wir könnten uns folgen.', npc_mood: 'happy', options: [
      { text: 'Ja klar! Ich suche dich gleich.', quality: 'good', feedback: 'Sıcak kabul.' },
      { text: 'Ja, @name.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ich nutze das nicht oft.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'Ja, ich schicke dir eine Anfrage.' },
    ]},
    { id: 'social-de-11', npc_message: 'Was machst du am Wochenende?', npc_mood: 'happy', options: [
      { text: 'Ich will die Stadt erkunden. Und du, hast du Pläne?', quality: 'good', feedback: 'Cevap + karşı soru.' },
      { text: 'Weiß noch nicht.', quality: 'ok', feedback: 'Dürüst ama devam etmiyor.' },
      { text: 'Wahrscheinlich schlafen.', quality: 'awkward', feedback: 'Yeni tanışılan birine negatif mesaj.', correction: 'Noch nichts fest, und du?' },
    ]},
    { id: 'social-de-12', npc_message: 'Es war schön, dich kennenzulernen! Bis bald.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Ganz meinerseits! Hat mich gefreut. Tschüss!', quality: 'good', feedback: 'Sıcak kapanış.' },
      { text: 'Danke, bis bald.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Bye.', quality: 'awkward', feedback: 'İngilizce bitiş garip.', correction: 'Ebenfalls, bis zum nächsten Mal!' },
    ]},
  ],
};

// ─── Café · Italian ──────────────────────────────────────────────────────────

const cafeIt: ScenarioDialogue = {
  stageType: 'cafe',
  language: 'it',
  sessionSize: 5,
  turns: [
    { id: 'cafe-it-01', npc_message: 'Buongiorno! Cosa prende?', npc_mood: 'happy', options: [
      { text: 'Buongiorno! Un caffè, per favore.', quality: 'good', feedback: '"Per favore" — İtalyancada her siparişte kibar standarttır.' },
      { text: 'Un caffè, grazie.', quality: 'ok', feedback: 'Anlaşılır.' },
      { text: 'Dammi un caffè.', quality: 'awkward', feedback: '"Dammi" emir kipi — barda kaba.', correction: 'Un caffè, per favore.' },
    ]},
    { id: 'cafe-it-02', npc_message: 'Al banco o al tavolo?', npc_mood: 'neutral', options: [
      { text: 'Al banco, grazie.', quality: 'good', feedback: '"Al banco" — İtalya\'da espresso barda içilir, bu doğal tercih.' },
      { text: 'Al tavolo.', quality: 'ok', feedback: 'Doğru ama barda içmek daha İtalyan.' },
      { text: 'Dove vuole lei.', quality: 'awkward', feedback: '"Nereye isterseniz" — garip.', correction: 'Al banco, grazie.' },
    ]},
    { id: 'cafe-it-03', npc_message: 'Vuole anche un cornetto? Sono appena sfornati.', npc_mood: 'happy', options: [
      { text: 'Sì, un cornetto anche, per favore.', quality: 'good', feedback: 'Doğal kabul.' },
      { text: 'No, grazie.', quality: 'ok', feedback: 'Kibarca ret.' },
      { text: 'Non voglio mangiare niente.', quality: 'awkward', feedback: 'Kaba.', correction: 'No, grazie, solo il caffè.' },
    ]},
    { id: 'cafe-it-04', npc_message: 'Paga in contanti o con carta?', npc_mood: 'neutral', options: [
      { text: 'Con carta, per favore.', quality: 'good', feedback: 'Net.' },
      { text: 'Carta.', quality: 'ok', feedback: 'Anlaşılır ama kısa.' },
      { text: 'Ho tutti e due.', quality: 'awkward', feedback: 'Seçim yapman lazım.', correction: 'Con carta, grazie.' },
    ]},
    { id: 'cafe-it-05', npc_message: 'Sono un euro e settanta.', npc_mood: 'neutral', options: [
      { text: 'Ecco a lei, grazie.', quality: 'good', feedback: '"Ecco a lei" — İtalyancada ödeme sırasında standart.' },
      { text: 'Grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Così caro?', quality: 'awkward', feedback: 'Şikayet.', correction: 'Ecco, grazie.' },
    ]},
    { id: 'cafe-it-06', npc_message: 'Il caffè è pronto. Vuole lo zucchero?', npc_mood: 'neutral', options: [
      { text: 'No grazie, lo prendo amaro.', quality: 'good', feedback: '"Amaro" (şekersiz) — İtalyancada espresso kültüründe doğru kelime.' },
      { text: 'No, grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Non mi piace lo zucchero.', quality: 'awkward', feedback: 'Çok fazla bilgi.', correction: 'No, senza zucchero, grazie.' },
    ]},
    { id: 'cafe-it-07', npc_message: 'Può spostarsi un attimo? C\'è molto movimento.', npc_mood: 'impatient', options: [
      { text: 'Certo, mi scusi.', quality: 'good', feedback: '"Mi scusi" — İtalyancada kibarca özür.' },
      { text: 'Sì, va bene.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Perché devo spostarmi?', quality: 'awkward', feedback: 'Barda yer açma talebine karşı çıkmak kaba.', correction: 'Certo, subito. Mi scusi.' },
    ]},
    { id: 'cafe-it-08', npc_message: 'Scusi, abbiamo finito il caffè normale. Va bene un ristretto?', npc_mood: 'confused', options: [
      { text: 'Sì, un ristretto va benissimo, grazie.', quality: 'good', feedback: 'Esnek kabul.' },
      { text: 'Va bene.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Non so cos\'è un ristretto.', quality: 'awkward', feedback: 'İtalyan baristesine bunu sormak garip.', correction: 'Sì, certo, grazie.' },
    ]},
    { id: 'cafe-it-09', npc_message: 'Vuole un bicchiere d\'acqua? È compreso.', npc_mood: 'happy', options: [
      { text: 'Sì, volentieri, grazie mille.', quality: 'good', feedback: '"Volentieri" — İtalyancada sıcak kabul ifadesi.' },
      { text: 'Sì, grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Non ne ho bisogno.', quality: 'awkward', feedback: 'Kaba ret.', correction: 'No grazie, molto gentile.' },
    ]},
    { id: 'cafe-it-10', npc_message: 'Ha bisogno della password del wifi?', npc_mood: 'neutral', options: [
      { text: 'Sì, per favore, sarebbe gentile.', quality: 'good', feedback: '"Sarebbe gentile" — İtalyancada kibar rica.' },
      { text: 'Sì, grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Datemi il wifi.', quality: 'awkward', feedback: 'Emir kipi — kaba.', correction: 'Sì, se possibile, grazie.' },
    ]},
    { id: 'cafe-it-11', npc_message: 'È la prima volta che viene da noi?', npc_mood: 'happy', options: [
      { text: 'Sì, un amico me l\'ha consigliato. È davvero accogliente qui.', quality: 'good', feedback: 'Kişisel bilgi + iltifat.' },
      { text: 'Sì, prima volta.', quality: 'ok', feedback: 'Doğru.' },
      { text: 'Non conosco Roma.', quality: 'awkward', feedback: 'Soruya aşırı geniş cevap.', correction: 'Sì, prima volta, mi piace molto.' },
    ]},
    { id: 'cafe-it-12', npc_message: 'Buona giornata! Torni presto.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Grazie, anche a lei! Arrivederci.', quality: 'good', feedback: '"Arrivederci" — resmi İtalyanca veda.' },
      { text: 'Grazie, ciao.', quality: 'ok', feedback: 'Yeterli, biraz gayri resmi.' },
      { text: 'Bye.', quality: 'awkward', feedback: 'İngilizce garip.', correction: 'Grazie mille, arrivederci!' },
    ]},
  ],
};

// ─── Travel · Italian ────────────────────────────────────────────────────────

const travelIt: ScenarioDialogue = {
  stageType: 'travel',
  language: 'it',
  sessionSize: 5,
  turns: [
    { id: 'travel-it-01', npc_message: 'Buongiorno, posso aiutarla?', npc_mood: 'neutral', options: [
      { text: 'Sì, grazie. Cerco la metropolitana per il Colosseo.', quality: 'good', feedback: '"Cerco" — yön aramak için standart İtalyanca.' },
      { text: 'Sì, la metro.', quality: 'ok', feedback: 'Eksik bilgi.' },
      { text: 'Sono perso.', quality: 'awkward', feedback: 'Nereye gittiğini söyle.', correction: 'Cerco la metro per il Colosseo.' },
    ]},
    { id: 'travel-it-02', npc_message: 'Ha bisogno di un biglietto?', npc_mood: 'neutral', options: [
      { text: 'Sì, un biglietto singolo, per favore.', quality: 'good', feedback: '"Biglietto singolo" — tek yön için doğru ifade.' },
      { text: 'Sì, un biglietto.', quality: 'ok', feedback: 'Anlaşılır.' },
      { text: 'Quanto costa?', quality: 'awkward', feedback: 'Soruya cevap vermeden fiyat sordu.', correction: 'Sì, un biglietto singolo.' },
    ]},
    { id: 'travel-it-03', npc_message: 'Deve cambiare alla stazione Termini, linea A.', npc_mood: 'neutral', options: [
      { text: 'Capito. Linea A a Termini, grazie.', quality: 'good', feedback: 'Bilgiyi tekrar etmek — doğru anlama.' },
      { text: 'Ok, grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'È complicato.', quality: 'awkward', feedback: '"Karmaşık" — bilgiyi reddetmek gibi.', correction: 'Capito, cambio a Termini.' },
    ]},
    { id: 'travel-it-04', npc_message: 'Attenzione, la linea è soppressa stasera per lavori.', npc_mood: 'impatient', options: [
      { text: 'Capisco. C\'è un\'alternativa?', quality: 'good', feedback: 'Durumu kabul + alternatif istemek.' },
      { text: 'Ah, capito.', quality: 'ok', feedback: 'Ne yapacağını sormadı.' },
      { text: 'Sempre questi lavori!', quality: 'awkward', feedback: 'Şikayet yardım etmez.', correction: 'C\'è un autobus sostitutivo?' },
    ]},
    { id: 'travel-it-05', npc_message: 'Il prossimo treno parte tra cinque minuti, binario tre.', npc_mood: 'neutral', options: [
      { text: 'Grazie, vado subito al binario tre.', quality: 'good', feedback: 'Bilgiyi teyit + harekete geçme.' },
      { text: 'Grazie, binario tre.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Cinque minuti, è troppo.', quality: 'awkward', feedback: 'Şikayet.', correction: 'Grazie! Vado subito.' },
    ]},
    { id: 'travel-it-06', npc_message: 'Posso aiutarla con il bagaglio?', npc_mood: 'happy', options: [
      { text: 'Sì, grazie mille, è molto gentile.', quality: 'good', feedback: '"Molto gentile" — yardım kabulünde sıcak.' },
      { text: 'No, grazie, ce la faccio.', quality: 'ok', feedback: 'Kibarca ret.' },
      { text: 'È pesante.', quality: 'awkward', feedback: 'Soruya cevap vermiyor.', correction: 'Sì, se non le dispiace, grazie.' },
    ]},
    { id: 'travel-it-07', npc_message: 'Il suo biglietto non è valido su questa tratta.', npc_mood: 'impatient', options: [
      { text: 'Mi scusi, cosa devo fare?', quality: 'good', feedback: 'Özür + çözüm istemek.' },
      { text: 'Ah, davvero?', quality: 'ok', feedback: 'Tepkisiz.' },
      { text: 'Ma io ho pagato!', quality: 'awkward', feedback: 'Tartışmak işe yaramaz.', correction: 'Come posso regolarizzare?' },
    ]},
    { id: 'travel-it-08', npc_message: 'Conosce Roma?', npc_mood: 'happy', options: [
      { text: 'Un po\', è la mia seconda visita. Adoro questa città.', quality: 'good', feedback: 'Kişisel bilgi + iltifat.' },
      { text: 'Non molto.', quality: 'ok', feedback: 'Dürüst.' },
      { text: 'Sono turista.', quality: 'awkward', feedback: '"Turistim" tam cevap değil.', correction: 'Un po\', sto ancora scoprendo.' },
    ]},
    { id: 'travel-it-09', npc_message: 'Non dimentichi di timbrare il biglietto.', npc_mood: 'neutral', options: [
      { text: 'Ah, giusto! Grazie del promemoria.', quality: 'good', feedback: '"Grazie del promemoria" — hatırlatma için teşekkür.' },
      { text: 'Sì, grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Lo so.', quality: 'awkward', feedback: '"Biliyorum" — kaba.', correction: 'Ah sì, grazie!' },
    ]},
    { id: 'travel-it-10', npc_message: 'Ha ancora domande?', npc_mood: 'neutral', options: [
      { text: 'No, credo di aver capito tutto. Grazie mille!', quality: 'good', feedback: 'Net kapanış.' },
      { text: 'No, grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Forse.', quality: 'awkward', feedback: '"Belki" — belirsiz.', correction: 'No, è tutto chiaro, grazie.' },
    ]},
    { id: 'travel-it-11', npc_message: 'Questa è la sua fermata.', npc_mood: 'neutral', options: [
      { text: 'Grazie mille, arrivederci!', quality: 'good', feedback: 'Teşekkür + veda.' },
      { text: 'Grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ok, ciao.', quality: 'awkward', feedback: '"Ciao" resmi bağlamda çok gayri resmi.', correction: 'Grazie, buona giornata!' },
    ]},
    { id: 'travel-it-12', npc_message: 'Buon viaggio! Godetevi Roma.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Grazie, molto gentile! Arrivederci.', quality: 'good', feedback: 'Sıcak kapanış.' },
      { text: 'Grazie, ciao.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Bye.', quality: 'awkward', feedback: 'İngilizce garip.', correction: 'Grazie mille, arrivederci!' },
    ]},
  ],
};

// ─── Business · Italian ───────────────────────────────────────────────────────

const businessIt: ScenarioDialogue = {
  stageType: 'business',
  language: 'it',
  sessionSize: 5,
  turns: [
    { id: 'biz-it-01', npc_message: 'Buongiorno, ha un appuntamento?', npc_mood: 'neutral', options: [
      { text: 'Sì, ho un appuntamento con il signor Rossi alle dieci.', quality: 'good', feedback: 'İsim ve saat.' },
      { text: 'Sì, ho un appuntamento.', quality: 'ok', feedback: 'Eksik bilgi.' },
      { text: 'Vengo per una riunione.', quality: 'awkward', feedback: 'Kiminle olduğunu belirt.', correction: 'Sì, con il signor Rossi.' },
    ]},
    { id: 'biz-it-02', npc_message: 'Piacere. Ho esaminato la sua proposta e ho alcune domande.', npc_mood: 'neutral', options: [
      { text: 'Piacere mio. Sono a sua completa disposizione.', quality: 'good', feedback: '"A sua disposizione" — İtalyan iş dilinde standart.' },
      { text: 'Piacere. Dica pure.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ciao. Quali domande?', quality: 'awkward', feedback: '"Ciao" resmi toplantıda uygunsuz.', correction: 'Piacere, con piacere rispondo.' },
    ]},
    { id: 'biz-it-03', npc_message: 'Il budget proposto sembra elevato. C\'è margine di trattativa?', npc_mood: 'impatient', options: [
      { text: 'Capisco la sua preoccupazione. Possiamo rivedere i termini insieme.', quality: 'good', feedback: 'Empati + çözüm odaklı.' },
      { text: 'Sì, possiamo parlare del prezzo.', quality: 'ok', feedback: 'Açık ama zayıf.' },
      { text: 'Il prezzo è giusto.', quality: 'awkward', feedback: 'Savunmaya geçiyor.', correction: 'Possiamo trovare un accordo vantaggioso.' },
    ]},
    { id: 'biz-it-04', npc_message: 'Quando potreste iniziare se raggiungiamo un accordo?', npc_mood: 'neutral', options: [
      { text: 'Potremmo iniziare a inizio mese prossimo, se per lei va bene.', quality: 'good', feedback: '"Se per lei va bene" — karşı tarafı dahil ediyor.' },
      { text: 'Il mese prossimo.', quality: 'ok', feedback: 'Net ama kısa.' },
      { text: 'Dipende.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'Tra due o tre settimane, se è d\'accordo.' },
    ]},
    { id: 'biz-it-05', npc_message: 'Abbiamo bisogno di referenze di progetti simili.', npc_mood: 'neutral', options: [
      { text: 'Certamente, posso inviarle tre referenze entro questa settimana.', quality: 'good', feedback: 'Somut taahhüt.' },
      { text: 'Abbiamo referenze.', quality: 'ok', feedback: 'Belirsiz.' },
      { text: 'Tutti i clienti sono soddisfatti.', quality: 'awkward', feedback: 'İspatsız iddia.', correction: 'Le mando le referenze domani.' },
    ]},
    { id: 'biz-it-06', npc_message: 'Il supporto tecnico è incluso dopo la consegna?', npc_mood: 'neutral', options: [
      { text: 'Sì, includiamo sei mesi di supporto senza costi aggiuntivi.', quality: 'good', feedback: 'Net, somut.' },
      { text: 'Sì, è incluso.', quality: 'ok', feedback: 'Doğru ama detay eksik.' },
      { text: 'Dipende dal contratto.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'Sì, sei mesi inclusi.' },
    ]},
    { id: 'biz-it-07', npc_message: 'Devo consultarmi con il mio team prima di decidere.', npc_mood: 'neutral', options: [
      { text: 'Certamente. Entro quando possiamo aspettarci una risposta?', quality: 'good', feedback: 'Baskısız zaman çerçevesi sorusu.' },
      { text: 'Va bene.', quality: 'ok', feedback: 'Ne zaman duyacağını sormadı.' },
      { text: 'Spero in una decisione rapida.', quality: 'awkward', feedback: 'Hafif baskı.', correction: 'Quando posso avere un suo feedback?' },
    ]},
    { id: 'biz-it-08', npc_message: 'Può lasciarci una copia della proposta?', npc_mood: 'neutral', options: [
      { text: 'Certo, ho copie cartacee e le mando anche la versione digitale.', quality: 'good', feedback: 'İki format.' },
      { text: 'Sì, eccola.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'È nella mia email.', quality: 'awkward', feedback: 'Karşı tarafa zor.', correction: 'Ecco una copia stampata.' },
    ]},
    { id: 'biz-it-09', npc_message: 'Ha un biglietto da visita?', npc_mood: 'neutral', options: [
      { text: 'Sì, eccolo. Posso aggiungerla anche su LinkedIn se lo desidera.', quality: 'good', feedback: 'Kart + LinkedIn.' },
      { text: 'Sì, eccolo.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'No, ma ho WhatsApp.', quality: 'awkward', feedback: 'Resmi toplantıda WhatsApp uygunsuz.', correction: 'Sì, ecco il mio biglietto.' },
    ]},
    { id: 'biz-it-10', npc_message: 'La ricontatteremo all\'inizio della settimana prossima.', npc_mood: 'neutral', options: [
      { text: 'Perfetto, sono disponibile per qualsiasi domanda nel frattempo.', quality: 'good', feedback: '"Disponibile" — profesyonel kapanış.' },
      { text: 'Grazie, arrivederci.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Aspetto la sua chiamata.', quality: 'awkward', feedback: 'Hafif baskı.', correction: 'La ringrazio, sono a disposizione.' },
    ]},
    { id: 'biz-it-11', npc_message: 'È stato un piacere. A presto.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Il piacere è stato mio. Buona giornata!', quality: 'good', feedback: '"Il piacere è stato mio" — İtalyan iş kapanışı.' },
      { text: 'Grazie, arrivederci.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ok, bye.', quality: 'awkward', feedback: 'İngilizce ve gayri resmi.', correction: 'Grazie a lei, a presto!' },
    ]},
    { id: 'biz-it-12', npc_message: 'Buona fortuna con il progetto!', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Grazie mille, contiamo sulla sua collaborazione!', quality: 'good', feedback: 'İşbirliğine vurgu.' },
      { text: 'Grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Sì, ciao.', quality: 'awkward', feedback: '"Ciao" resmi bağlamda gayri resmi.', correction: 'Grazie, a presto!' },
    ]},
  ],
};

// ─── Social · Italian ─────────────────────────────────────────────────────────

const socialIt: ScenarioDialogue = {
  stageType: 'social',
  language: 'it',
  sessionSize: 5,
  turns: [
    { id: 'social-it-01', npc_message: 'Ciao! È la prima volta che vieni qui?', npc_mood: 'happy', options: [
      { text: 'Sì, me l\'hanno consigliato degli amici. E tu, ci vieni spesso?', quality: 'good', feedback: 'Cevap + karşı soru.' },
      { text: 'Sì, prima volta.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Non conosco nessuno qui.', quality: 'awkward', feedback: 'Olumsuz açılış.', correction: 'Sì, sono venuto con degli amici.' },
    ]},
    { id: 'social-it-02', npc_message: 'Di dove sei?', npc_mood: 'happy', options: [
      { text: 'Sono della Turchia, di Istanbul. E tu?', quality: 'good', feedback: 'Cevap + karşı soru.' },
      { text: 'Della Turchia.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Sono straniero.', quality: 'awkward', feedback: 'Soruya cevap vermiyor.', correction: 'Sono turco, di Istanbul. E tu?' },
    ]},
    { id: 'social-it-03', npc_message: 'Cosa fai nella vita?', npc_mood: 'happy', options: [
      { text: 'Lavoro nell\'informatica. E tu?', quality: 'good', feedback: 'Kısa + karşı soru.' },
      { text: 'Sono ingegnere.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Lavoro tanto.', quality: 'awkward', feedback: 'Cevap değil.', correction: 'Lavoro in tecnologia, e tu?' },
    ]},
    { id: 'social-it-04', npc_message: 'Cosa ne pensi della serata?', npc_mood: 'happy', options: [
      { text: 'Bellissima, adoro l\'atmosfera! Conosci la gente qui?', quality: 'good', feedback: 'İltifat + soru.' },
      { text: 'Abbastanza bene.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Non capisco questa musica.', quality: 'awkward', feedback: 'Sosyal ortamda negatif.', correction: 'Mi piace molto, e a te?' },
    ]},
    { id: 'social-it-05', npc_message: 'Ti offro qualcosa da bere?', npc_mood: 'happy', options: [
      { text: 'Volentieri, una birra sarebbe perfetta, grazie!', quality: 'good', feedback: '"Volentieri" — sıcak kabul.' },
      { text: 'Sì, grazie.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ho già da bere.', quality: 'awkward', feedback: 'Sert ret.', correction: 'No grazie, ho già qualcosa, ma grazie lo stesso.' },
    ]},
    { id: 'social-it-06', npc_message: 'Da quanto tempo sei in Italia?', npc_mood: 'happy', options: [
      { text: 'Tre mesi. Sto ancora imparando l\'italiano!', quality: 'good', feedback: 'Alçakgönüllülük.' },
      { text: 'Tre mesi.', quality: 'ok', feedback: 'Doğru ama devam etmiyor.' },
      { text: 'Non molto.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'Qualche mese, mi sto ancora adattando.' },
    ]},
    { id: 'social-it-07', npc_message: 'Conosci un buon ristorante qui vicino?', npc_mood: 'happy', options: [
      { text: 'Non ancora, sono nuovo. Tu ne consiglieresti uno?', quality: 'good', feedback: 'Öneri istemek.' },
      { text: 'Non lo so.', quality: 'ok', feedback: 'Dürüst ama fırsatı kaçırıyor.' },
      { text: 'Non conosco Roma.', quality: 'awkward', feedback: 'Konuşmayı bitiriyor.', correction: 'Non ancora, tu cosa consiglieresti?' },
    ]},
    { id: 'social-it-08', npc_message: 'Ti andrebbe di ballare?', npc_mood: 'happy', options: [
      { text: 'Perché no, dai andiamo!', quality: 'good', feedback: '"Dai andiamo" — İtalyancada enerjik kabul.' },
      { text: 'Non so ballare.', quality: 'ok', feedback: 'Dürüst ret.' },
      { text: 'Sono stanco.', quality: 'awkward', feedback: 'Partide yorgunluk bahanesi soğuk.', correction: 'Non molto, ma ci provo!' },
    ]},
    { id: 'social-it-09', npc_message: 'Ti presento il mio amico Marco.', npc_mood: 'happy', options: [
      { text: 'Ciao Marco, piacere! Sei anche tu di Roma?', quality: 'good', feedback: 'Selamlama + soru.' },
      { text: 'Ciao, piacere.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Ciao.', quality: 'awkward', feedback: 'Çok kısa.', correction: 'Ciao Marco, molto piacere.' },
    ]},
    { id: 'social-it-10', npc_message: 'Sei su Instagram? Potremmo seguirci.', npc_mood: 'happy', options: [
      { text: 'Sì, certo! Ti cerco adesso.', quality: 'good', feedback: 'Sıcak kabul.' },
      { text: 'Sì, @nome.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Non lo uso molto.', quality: 'awkward', feedback: 'Belirsiz.', correction: 'Sì, ti mando una richiesta.' },
    ]},
    { id: 'social-it-11', npc_message: 'Che programmi hai per il weekend?', npc_mood: 'happy', options: [
      { text: 'Voglio esplorare il quartiere. E tu, hai programmi?', quality: 'good', feedback: 'Cevap + karşı soru.' },
      { text: 'Non lo so ancora.', quality: 'ok', feedback: 'Dürüst ama devam etmiyor.' },
      { text: 'Probabilmente dormire.', quality: 'awkward', feedback: 'Yeni tanışılan birine negatif mesaj.', correction: 'Niente di preciso, e tu?' },
    ]},
    { id: 'social-it-12', npc_message: 'È stato un piacere conoscerti! A presto spero.', npc_mood: 'happy', scene_complete: true, options: [
      { text: 'Altrettanto! Mi ha fatto piacere. A presto!', quality: 'good', feedback: 'Sıcak kapanış.' },
      { text: 'Grazie, a presto.', quality: 'ok', feedback: 'Yeterli.' },
      { text: 'Bye.', quality: 'awkward', feedback: 'İngilizce garip.', correction: 'Piacere mio, a presto!' },
    ]},
  ],
};

// ─── Survival · Spanish ──────────────────────────────────────────────────────

const survivalEs: ScenarioDialogue = {
  stageType: 'survival',
  language: 'es',
  sessionSize: 5,
  turns: [
    { id: 'survival-es-01', npc_message: 'Disculpe, ¿necesita ayuda?', npc_mood: 'neutral', options: [
      { text: 'Sí, por favor — estoy un poco perdido.', quality: 'good', feedback: '"Estoy un poco perdido" suena natural y tranquilo.' },
      { text: 'Sí, estoy perdido.', quality: 'ok', feedback: 'Correcto y claro.', correction: 'Sí, ¿podría ayudarme? Estoy perdido.' },
      { text: 'No sé dónde voy ahora.', quality: 'awkward', feedback: 'La idea se entiende, pero "estoy perdido" es la frase natural.', correction: 'Estoy perdido — ¿podría ayudarme?' },
    ]},
    { id: 'survival-es-02', npc_message: '¿Está bien? Parece que necesita algo.', npc_mood: 'neutral', options: [
      { text: 'Estoy bien, gracias — necesito encontrar una farmacia.', quality: 'good', feedback: 'Tranquilo, educado y directo.' },
      { text: 'Necesito farmacia.', quality: 'ok', feedback: 'Se entiende, pero falta el artículo.', correction: 'Necesito encontrar una farmacia.' },
      { text: 'Busco tienda de medicina.', quality: 'awkward', feedback: '"Tienda de medicina" no suena natural; usa "farmacia".', correction: 'Busco una farmacia, por favor.' },
    ]},
    { id: 'survival-es-03', npc_message: '¿Qué le pasa?', npc_mood: 'neutral', options: [
      { text: 'Me duele mucho la cabeza — ¿tiene algo para el dolor?', quality: 'good', feedback: '"Me duele..." es la forma natural de explicar una molestia.' },
      { text: 'Tengo dolor de cabeza. Dame medicina.', quality: 'ok', feedback: '"Dame" suena brusco; una pregunta es más amable.', correction: 'Tengo dolor de cabeza — ¿me puede recomendar algo?' },
      { text: 'Mi cabeza tiene dolor dentro.', quality: 'awkward', feedback: 'Demasiado literal; "me duele la cabeza" es suficiente.', correction: 'Me duele mucho la cabeza.' },
    ]},
    { id: 'survival-es-04', npc_message: '¿Ha tomado algo ya?', npc_mood: 'neutral', options: [
      { text: 'No, todavía no — por eso vine aquí.', quality: 'good', feedback: 'Natural y explica la situación.' },
      { text: 'No. Nada.', quality: 'ok', feedback: 'Claro; una frase completa suena mejor.', correction: 'No, todavía no.' },
      { text: 'Antes de venir aquí no tomé píldoras.', quality: 'awkward', feedback: 'Correcto pero poco natural.', correction: 'No, todavía no he tomado nada.' },
    ]},
    { id: 'survival-es-05', npc_message: 'Le recomiendo ibuprofeno. ¿Tiene alguna alergia?', npc_mood: 'neutral', options: [
      { text: 'Que yo sepa, no.', quality: 'good', feedback: '"Que yo sepa" es muy natural para alergias conocidas.' },
      { text: 'No tengo alergia.', quality: 'ok', feedback: 'Correcto; en plural suena más natural.', correction: 'No, no tengo alergias.' },
      { text: 'No sé sobre mis alergias.', quality: 'awkward', feedback: 'Suena raro; mejor usar una frase corta.', correction: 'Que yo sepa, no.' },
    ]},
    { id: 'survival-es-06', npc_message: 'Son 6 euros. ¿Cómo quiere pagar?', npc_mood: 'neutral', options: [
      { text: 'Con tarjeta, por favor.', quality: 'good', feedback: 'Directo y natural.' },
      { text: 'Tarjeta.', quality: 'ok', feedback: 'Funciona, pero añadir "por favor" suaviza el tono.', correction: 'Con tarjeta, por favor.' },
      { text: 'Uso mi tarjeta para pagar ahora.', quality: 'awkward', feedback: 'Demasiado largo para la caja.', correction: 'Pago con tarjeta, por favor.' },
    ]},
    { id: 'survival-es-07', npc_message: 'Tome dos comprimidos con agua cada seis horas.', npc_mood: 'neutral', options: [
      { text: 'Entendido — dos comprimidos cada seis horas. Gracias.', quality: 'good', feedback: 'Repetir la instrucción confirma que entendiste.' },
      { text: 'Vale, entiendo.', quality: 'ok', feedback: 'Correcto; repetir la dosis sería mejor.', correction: 'Vale, dos comprimidos cada seis horas.' },
      { text: 'Como dos comprimido con agua, ¿sí?', quality: 'awkward', feedback: 'Con medicinas se usa "tomar", no "comer"; y "comprimidos" en plural.', correction: 'Tomo dos comprimidos con agua cada seis horas, ¿verdad?' },
    ]},
    { id: 'survival-es-08', npc_message: 'Si no mejora, vaya al médico.', npc_mood: 'neutral', options: [
      { text: 'De acuerdo — gracias por el consejo.', quality: 'good', feedback: 'Natural y agradecido.' },
      { text: 'OK. Voy al médico si sigue.', quality: 'ok', feedback: 'Se entiende; "si no mejora" es más natural.', correction: 'De acuerdo, iré al médico si no mejora.' },
      { text: 'El médico es caro aquí.', quality: 'awkward', feedback: 'Se sale del objetivo; confirma que entendiste el consejo.', correction: 'Entendido, gracias por avisarme.' },
    ]},
    { id: 'survival-es-09', npc_message: '¿Necesita algo más?', npc_mood: 'neutral', options: [
      { text: 'No, creo que eso es todo — muchas gracias.', quality: 'good', feedback: '"Eso es todo" cierra la interacción de forma natural.' },
      { text: 'No, gracias.', quality: 'ok', feedback: 'Correcto y educado.' },
      { text: 'No quiero más cosas. Adiós.', quality: 'awkward', feedback: '"Más cosas" suena poco natural.', correction: 'No, eso es todo. Gracias.' },
    ]},
    { id: 'survival-es-10', npc_message: '¡Que se mejore!', npc_mood: 'happy', options: [
      { text: 'Muchas gracias, muy amable.', quality: 'good', feedback: 'Cálido y natural.' },
      { text: 'Gracias. Adiós.', quality: 'ok', feedback: 'Educado, aunque un poco seco.', correction: 'Gracias, que tenga buen día.' },
      { text: 'Sí, yo también mejoro.', quality: 'awkward', feedback: 'No suena natural; basta con agradecer.', correction: 'Gracias, eso espero.' },
    ]},
    { id: 'survival-es-11', npc_message: 'Perdone, ¿sabe dónde está el supermercado más cercano?', npc_mood: 'neutral', options: [
      { text: 'Claro — hay uno en la esquina, a dos minutos.', quality: 'good', feedback: '"En la esquina" y "a dos minutos" dan una ayuda concreta.' },
      { text: 'Supermercado cerca aquí.', quality: 'ok', feedback: 'Se entiende; falta estructura.', correction: 'Hay un supermercado cerca de aquí.' },
      { text: 'No sé. Quizá por allí.', quality: 'awkward', feedback: 'Si no sabes, dilo con claridad y disculpa.', correction: 'No estoy seguro, lo siento.' },
    ]},
    { id: 'survival-es-12', npc_message: '¿Alguien habla español? Necesito ayuda con mi teléfono.', npc_mood: 'neutral', scene_complete: true, options: [
      { text: 'Yo hablo español — ¿qué problema tiene?', quality: 'good', feedback: 'Natural, directo y útil.' },
      { text: 'Sí. ¿Qué problema?', quality: 'ok', feedback: 'Funciona, pero la frase completa suena mejor.', correction: 'Sí, hablo español — ¿qué le pasa al teléfono?' },
      { text: 'Yo español también. Teléfono problema?', quality: 'awkward', feedback: 'Telegráfico; forma una pregunta completa.', correction: 'Hablo español — ¿cuál es el problema con el teléfono?' },
    ]},
  ],
};

// ─── Survival · French ───────────────────────────────────────────────────────

const survivalFr: ScenarioDialogue = {
  stageType: 'survival',
  language: 'fr',
  sessionSize: 5,
  turns: [
    { id: 'survival-fr-01', npc_message: 'Excusez-moi, vous avez besoin d’aide ?', npc_mood: 'neutral', options: [
      { text: 'Oui, s’il vous plaît — je suis un peu perdu.', quality: 'good', feedback: '"Un peu perdu" est naturel et calme.' },
      { text: 'Oui, je suis perdu.', quality: 'ok', feedback: 'Clair et correct.', correction: 'Oui, pourriez-vous m’aider ? Je suis perdu.' },
      { text: 'Je ne sais pas où je vais maintenant.', quality: 'awkward', feedback: 'Trop littéral; "je suis perdu" suffit.', correction: 'Je suis perdu — pouvez-vous m’aider ?' },
    ]},
    { id: 'survival-fr-02', npc_message: 'Ça va ? Vous avez l’air d’avoir besoin d’aide.', npc_mood: 'neutral', options: [
      { text: 'Ça va, merci — je cherche une pharmacie.', quality: 'good', feedback: 'Naturel, poli et précis.' },
      { text: 'Je besoin pharmacie.', quality: 'ok', feedback: 'Compréhensible, mais la structure est incorrecte.', correction: 'Je cherche une pharmacie.' },
      { text: 'Je cherche magasin de médicaments.', quality: 'awkward', feedback: 'On dit simplement "pharmacie".', correction: 'Je cherche une pharmacie, s’il vous plaît.' },
    ]},
    { id: 'survival-fr-03', npc_message: 'Quel est le problème ?', npc_mood: 'neutral', options: [
      { text: 'J’ai très mal à la tête — vous avez quelque chose contre la douleur ?', quality: 'good', feedback: '"Avoir mal à..." est la structure naturelle.' },
      { text: 'J’ai douleur tête. Donnez médicament.', quality: 'ok', feedback: 'Trop direct; formulez une demande polie.', correction: 'J’ai mal à la tête — vous pouvez me conseiller quelque chose ?' },
      { text: 'Ma tête fait douleur dedans.', quality: 'awkward', feedback: 'Trop littéral; dites "j’ai mal à la tête".', correction: 'J’ai très mal à la tête.' },
    ]},
    { id: 'survival-fr-04', npc_message: 'Vous avez déjà pris quelque chose ?', npc_mood: 'neutral', options: [
      { text: 'Non, pas encore — c’est pour ça que je suis venu.', quality: 'good', feedback: 'Naturel et clair.' },
      { text: 'Non. Rien.', quality: 'ok', feedback: 'Clair; une phrase complète est plus fluide.', correction: 'Non, pas encore.' },
      { text: 'Avant venir ici je n’ai pas pris pilules.', quality: 'awkward', feedback: 'Structure incorrecte et peu naturelle.', correction: 'Non, je n’ai encore rien pris.' },
    ]},
    { id: 'survival-fr-05', npc_message: 'Je vous conseille de l’ibuprofène. Vous avez des allergies ?', npc_mood: 'neutral', options: [
      { text: 'Pas à ma connaissance.', quality: 'good', feedback: 'Formule très naturelle pour les allergies.' },
      { text: 'Non, pas d’allergie.', quality: 'ok', feedback: 'Correct et clair.', correction: 'Non, pas d’allergies connues.' },
      { text: 'Je ne sais pas mes allergies.', quality: 'awkward', feedback: 'Il manque une structure naturelle.', correction: 'Pas à ma connaissance.' },
    ]},
    { id: 'survival-fr-06', npc_message: 'Ça fait 6 euros. Vous payez comment ?', npc_mood: 'neutral', options: [
      { text: 'Par carte, s’il vous plaît.', quality: 'good', feedback: 'Simple et naturel.' },
      { text: 'Carte.', quality: 'ok', feedback: 'Compréhensible; ajoutez la préposition.', correction: 'Par carte, s’il vous plaît.' },
      { text: 'J’utilise ma carte pour payer maintenant.', quality: 'awkward', feedback: 'Trop formel et long pour la caisse.', correction: 'Je paie par carte, s’il vous plaît.' },
    ]},
    { id: 'survival-fr-07', npc_message: 'Prenez deux comprimés avec de l’eau toutes les six heures.', npc_mood: 'neutral', options: [
      { text: 'D’accord — deux comprimés toutes les six heures. Merci.', quality: 'good', feedback: 'Répéter la posologie confirme que vous avez compris.' },
      { text: 'OK, j’ai compris.', quality: 'ok', feedback: 'Correct; répéter la dose serait encore mieux.', correction: 'D’accord, deux comprimés toutes les six heures.' },
      { text: 'Je mange deux comprimé avec eau ?', quality: 'awkward', feedback: 'Pour les médicaments, on dit "prendre", pas "manger".', correction: 'Je prends deux comprimés avec de l’eau, c’est ça ?' },
    ]},
    { id: 'survival-fr-08', npc_message: 'Si ça ne s’améliore pas, consultez un médecin.', npc_mood: 'neutral', options: [
      { text: 'D’accord — merci pour le conseil.', quality: 'good', feedback: 'Naturel et reconnaissant.' },
      { text: 'OK. Je vais médecin si continue.', quality: 'ok', feedback: 'Compréhensible; il manque "chez le".', correction: 'D’accord, j’irai chez le médecin si ça continue.' },
      { text: 'Le médecin est cher ici.', quality: 'awkward', feedback: 'Hors sujet; confirmez plutôt le conseil.', correction: 'D’accord, merci de m’avoir prévenu.' },
    ]},
    { id: 'survival-fr-09', npc_message: 'Vous avez besoin d’autre chose ?', npc_mood: 'neutral', options: [
      { text: 'Non, je crois que c’est tout — merci beaucoup.', quality: 'good', feedback: '"C’est tout" ferme naturellement l’échange.' },
      { text: 'Non, merci.', quality: 'ok', feedback: 'Correct et poli.' },
      { text: 'Je ne veux pas plus de choses. Au revoir.', quality: 'awkward', feedback: '"Plus de choses" sonne peu naturel.', correction: 'Non, c’est tout. Merci.' },
    ]},
    { id: 'survival-fr-10', npc_message: 'Bon rétablissement !', npc_mood: 'happy', options: [
      { text: 'Merci beaucoup, c’est gentil.', quality: 'good', feedback: 'Chaleureux et naturel.' },
      { text: 'Merci. Au revoir.', quality: 'ok', feedback: 'Poli mais un peu sec.', correction: 'Merci, bonne journée.' },
      { text: 'Oui, moi aussi je rétablis.', quality: 'awkward', feedback: 'Formulation incorrecte; remerciez simplement.', correction: 'Merci, j’espère aussi.' },
    ]},
    { id: 'survival-fr-11', npc_message: 'Excusez-moi, vous savez où est le supermarché le plus proche ?', npc_mood: 'neutral', options: [
      { text: 'Bien sûr — il y en a un au coin de la rue.', quality: 'good', feedback: '"Au coin de la rue" est une indication naturelle.' },
      { text: 'Supermarché proche ici.', quality: 'ok', feedback: 'Compréhensible; structurez la phrase.', correction: 'Il y a un supermarché près d’ici.' },
      { text: 'Je ne sais pas. Peut-être là-bas.', quality: 'awkward', feedback: 'Si vous n’êtes pas sûr, dites-le clairement.', correction: 'Je ne suis pas sûr, désolé.' },
    ]},
    { id: 'survival-fr-12', npc_message: 'Quelqu’un parle français ? J’ai besoin d’aide avec mon téléphone.', npc_mood: 'neutral', scene_complete: true, options: [
      { text: 'Je parle français — quel est le problème ?', quality: 'good', feedback: 'Naturel, direct et utile.' },
      { text: 'Oui. Quel problème ?', quality: 'ok', feedback: 'Fonctionne; la phrase complète est plus naturelle.', correction: 'Oui, je parle français — qu’est-ce qui ne va pas ?' },
      { text: 'Moi français aussi. Téléphone problème ?', quality: 'awkward', feedback: 'Télégraphique; formez une question complète.', correction: 'Je parle français — quel est le problème avec votre téléphone ?' },
    ]},
  ],
};

// ─── Survival · German ───────────────────────────────────────────────────────

const survivalDe: ScenarioDialogue = {
  stageType: 'survival',
  language: 'de',
  sessionSize: 5,
  turns: [
    { id: 'survival-de-01', npc_message: 'Entschuldigung, brauchen Sie Hilfe?', npc_mood: 'neutral', options: [
      { text: 'Ja, bitte — ich habe mich ein bisschen verlaufen.', quality: 'good', feedback: '"Ein bisschen verlaufen" klingt natürlich und ruhig.' },
      { text: 'Ja, ich bin verloren.', quality: 'ok', feedback: 'Verständlich, aber "ich habe mich verlaufen" ist natürlicher.', correction: 'Ja, können Sie mir helfen? Ich habe mich verlaufen.' },
      { text: 'Ich weiß nicht, wo ich jetzt gehe.', quality: 'awkward', feedback: 'Wörtlich übersetzt; nutze "sich verlaufen".', correction: 'Ich habe mich verlaufen — können Sie mir helfen?' },
    ]},
    { id: 'survival-de-02', npc_message: 'Alles in Ordnung? Sie sehen aus, als bräuchten Sie Hilfe.', npc_mood: 'neutral', options: [
      { text: 'Alles gut, danke — ich suche eine Apotheke.', quality: 'good', feedback: 'Natürlich, höflich und konkret.' },
      { text: 'Ich brauche Apotheke.', quality: 'ok', feedback: 'Verständlich; der Artikel fehlt.', correction: 'Ich suche eine Apotheke.' },
      { text: 'Ich suche Medizinladen.', quality: 'awkward', feedback: 'Man sagt "Apotheke", nicht "Medizinladen".', correction: 'Ich suche eine Apotheke, bitte.' },
    ]},
    { id: 'survival-de-03', npc_message: 'Was ist das Problem?', npc_mood: 'neutral', options: [
      { text: 'Ich habe starke Kopfschmerzen — haben Sie etwas gegen Schmerzen?', quality: 'good', feedback: '"Etwas gegen Schmerzen" ist natürliche Apothekensprache.' },
      { text: 'Ich habe Kopfweh. Gib mir Medizin.', quality: 'ok', feedback: '"Gib mir" ist zu direkt; frage höflicher.', correction: 'Ich habe Kopfschmerzen — können Sie mir etwas empfehlen?' },
      { text: 'Mein Kopf hat Schmerz innen.', quality: 'awkward', feedback: 'Zu wörtlich; "ich habe Kopfschmerzen" reicht.', correction: 'Ich habe starke Kopfschmerzen.' },
    ]},
    { id: 'survival-de-04', npc_message: 'Haben Sie schon etwas dagegen genommen?', npc_mood: 'neutral', options: [
      { text: 'Nein, noch nicht — deshalb bin ich hier.', quality: 'good', feedback: 'Natürlich und klar.' },
      { text: 'Nein. Nichts.', quality: 'ok', feedback: 'Klar; ein ganzer Satz klingt flüssiger.', correction: 'Nein, noch nichts.' },
      { text: 'Bevor ich hier kam, nahm ich keine Pillen.', quality: 'awkward', feedback: 'Grammatikalisch holprig und unnatürlich.', correction: 'Nein, ich habe noch nichts genommen.' },
    ]},
    { id: 'survival-de-05', npc_message: 'Ich empfehle Ibuprofen. Haben Sie Allergien?', npc_mood: 'neutral', options: [
      { text: 'Nicht, dass ich wüsste.', quality: 'good', feedback: 'Sehr natürliche Antwort bei bekannten Allergien.' },
      { text: 'Keine Allergie.', quality: 'ok', feedback: 'Verständlich; im Plural natürlicher.', correction: 'Nein, ich habe keine Allergien.' },
      { text: 'Ich weiß nicht über meine Allergien.', quality: 'awkward', feedback: 'Unnatürliche Struktur.', correction: 'Nicht, dass ich wüsste.' },
    ]},
    { id: 'survival-de-06', npc_message: 'Das macht 6 Euro. Wie möchten Sie bezahlen?', npc_mood: 'neutral', options: [
      { text: 'Mit Karte, bitte.', quality: 'good', feedback: 'Kurz, höflich und natürlich.' },
      { text: 'Karte.', quality: 'ok', feedback: 'Funktioniert, aber "mit Karte" ist natürlicher.', correction: 'Mit Karte, bitte.' },
      { text: 'Ich benutze meine Karte, um jetzt zu bezahlen.', quality: 'awkward', feedback: 'Zu lang für die Kasse.', correction: 'Ich zahle mit Karte, bitte.' },
    ]},
    { id: 'survival-de-07', npc_message: 'Nehmen Sie zwei Tabletten mit Wasser, alle sechs Stunden.', npc_mood: 'neutral', options: [
      { text: 'Verstanden — zwei Tabletten alle sechs Stunden. Danke.', quality: 'good', feedback: 'Die Dosierung zu wiederholen zeigt, dass du verstanden hast.' },
      { text: 'Okay, ich verstehe.', quality: 'ok', feedback: 'Korrekt; die Dosis zu wiederholen wäre besser.', correction: 'Okay, zwei Tabletten alle sechs Stunden.' },
      { text: 'Ich esse zwei Tablette mit Wasser?', quality: 'awkward', feedback: 'Bei Medikamenten sagt man "nehmen", nicht "essen"; "Tabletten" im Plural.', correction: 'Ich nehme zwei Tabletten mit Wasser, richtig?' },
    ]},
    { id: 'survival-de-08', npc_message: 'Wenn es nicht besser wird, gehen Sie bitte zum Arzt.', npc_mood: 'neutral', options: [
      { text: 'Mache ich — danke für den Hinweis.', quality: 'good', feedback: '"Mache ich" ist natürlich und bestätigt die Empfehlung.' },
      { text: 'OK. Ich gehe Arzt wenn weiter.', quality: 'ok', feedback: 'Verständlich; "zum Arzt" und "wenn es nicht besser wird" sind nötig.', correction: 'Okay, ich gehe zum Arzt, wenn es nicht besser wird.' },
      { text: 'Der Arzt ist hier teuer.', quality: 'awkward', feedback: 'Das weicht aus; bestätige lieber den Rat.', correction: 'Verstanden, danke für den Hinweis.' },
    ]},
    { id: 'survival-de-09', npc_message: 'Brauchen Sie sonst noch etwas?', npc_mood: 'neutral', options: [
      { text: 'Nein, ich glaube, das ist alles — vielen Dank.', quality: 'good', feedback: '"Das ist alles" beendet die Szene natürlich.' },
      { text: 'Nein, danke.', quality: 'ok', feedback: 'Korrekt und höflich.' },
      { text: 'Ich will keine mehr Dinge. Tschüss.', quality: 'awkward', feedback: 'Unnatürlich; nutze "das ist alles".', correction: 'Nein, das ist alles. Danke.' },
    ]},
    { id: 'survival-de-10', npc_message: 'Gute Besserung!', npc_mood: 'happy', options: [
      { text: 'Vielen Dank, sehr freundlich.', quality: 'good', feedback: 'Warm und natürlich.' },
      { text: 'Danke. Auf Wiedersehen.', quality: 'ok', feedback: 'Höflich, aber etwas knapp.', correction: 'Danke, Ihnen einen schönen Tag.' },
      { text: 'Ja, ich besser auch.', quality: 'awkward', feedback: 'Nicht natürlich; einfach bedanken.', correction: 'Danke, das hoffe ich auch.' },
    ]},
    { id: 'survival-de-11', npc_message: 'Entschuldigung, wissen Sie, wo der nächste Supermarkt ist?', npc_mood: 'neutral', options: [
      { text: 'Natürlich — da vorne an der Ecke ist einer.', quality: 'good', feedback: '"An der Ecke" ist eine konkrete, natürliche Wegangabe.' },
      { text: 'Supermarkt ist nah hier.', quality: 'ok', feedback: 'Verständlich; "in der Nähe" klingt natürlicher.', correction: 'Hier in der Nähe ist ein Supermarkt.' },
      { text: 'Ich weiß nicht. Vielleicht dort.', quality: 'awkward', feedback: 'Wenn du unsicher bist, sag es klar.', correction: 'Ich bin nicht sicher, tut mir leid.' },
    ]},
    { id: 'survival-de-12', npc_message: 'Spricht hier jemand Deutsch? Ich brauche Hilfe mit meinem Handy.', npc_mood: 'neutral', scene_complete: true, options: [
      { text: 'Ich spreche Deutsch — was ist das Problem?', quality: 'good', feedback: 'Natürlich, direkt und hilfreich.' },
      { text: 'Ja. Was Problem?', quality: 'ok', feedback: 'Verständlich; Wortstellung fehlt.', correction: 'Ja, ich spreche Deutsch — was ist los?' },
      { text: 'Ich Deutsch auch. Handy Problem?', quality: 'awkward', feedback: 'Telegraphisch; bilde eine vollständige Frage.', correction: 'Ich spreche Deutsch — was ist mit dem Handy passiert?' },
    ]},
  ],
};

// ─── Survival · Italian ──────────────────────────────────────────────────────

const survivalIt: ScenarioDialogue = {
  stageType: 'survival',
  language: 'it',
  sessionSize: 5,
  turns: [
    { id: 'survival-it-01', npc_message: 'Mi scusi, ha bisogno di aiuto?', npc_mood: 'neutral', options: [
      { text: 'Sì, per favore — mi sono un po’ perso.', quality: 'good', feedback: '"Mi sono perso" è naturale e chiaro.' },
      { text: 'Sì, sono perso.', quality: 'ok', feedback: 'Si capisce, ma "mi sono perso" è più naturale.', correction: 'Sì, può aiutarmi? Mi sono perso.' },
      { text: 'Non so dove vado adesso.', quality: 'awkward', feedback: 'Troppo letterale; usa "mi sono perso".', correction: 'Mi sono perso — può aiutarmi?' },
    ]},
    { id: 'survival-it-02', npc_message: 'Tutto bene? Sembra che abbia bisogno di aiuto.', npc_mood: 'neutral', options: [
      { text: 'Sto bene, grazie — devo trovare una farmacia.', quality: 'good', feedback: 'Naturale, educato e preciso.' },
      { text: 'Ho bisogno farmacia.', quality: 'ok', feedback: 'Si capisce, ma manca la preposizione.', correction: 'Ho bisogno di trovare una farmacia.' },
      { text: 'Cerco negozio di medicine.', quality: 'awkward', feedback: 'Si dice semplicemente "farmacia".', correction: 'Cerco una farmacia, per favore.' },
    ]},
    { id: 'survival-it-03', npc_message: 'Qual è il problema?', npc_mood: 'neutral', options: [
      { text: 'Ho un forte mal di testa — ha qualcosa per il dolore?', quality: 'good', feedback: '"Mal di testa" è l’espressione naturale.' },
      { text: 'Ho dolore testa. Dammi medicina.', quality: 'ok', feedback: '"Dammi" è troppo diretto; meglio chiedere con cortesia.', correction: 'Ho mal di testa — può consigliarmi qualcosa?' },
      { text: 'La mia testa ha dolore dentro.', quality: 'awkward', feedback: 'Troppo letterale; basta "ho mal di testa".', correction: 'Ho un forte mal di testa.' },
    ]},
    { id: 'survival-it-04', npc_message: 'Ha già preso qualcosa?', npc_mood: 'neutral', options: [
      { text: 'No, non ancora — per questo sono venuto qui.', quality: 'good', feedback: 'Naturale e chiaro.' },
      { text: 'No. Niente.', quality: 'ok', feedback: 'Chiaro; una frase completa scorre meglio.', correction: 'No, non ancora.' },
      { text: 'Prima di venire qui non ho preso pillole.', quality: 'awkward', feedback: 'Si capisce, ma suona poco naturale.', correction: 'No, non ho ancora preso niente.' },
    ]},
    { id: 'survival-it-05', npc_message: 'Le consiglio l’ibuprofene. Ha allergie?', npc_mood: 'neutral', options: [
      { text: 'Non che io sappia.', quality: 'good', feedback: 'Formula molto naturale per allergie conosciute.' },
      { text: 'Non ho allergia.', quality: 'ok', feedback: 'Corretto ma il plurale suona meglio.', correction: 'No, non ho allergie.' },
      { text: 'Non so sulle mie allergie.', quality: 'awkward', feedback: 'Struttura poco naturale.', correction: 'Non che io sappia.' },
    ]},
    { id: 'survival-it-06', npc_message: 'Sono 6 euro. Come preferisce pagare?', npc_mood: 'neutral', options: [
      { text: 'Con carta, per favore.', quality: 'good', feedback: 'Semplice e naturale.' },
      { text: 'Carta.', quality: 'ok', feedback: 'Funziona, ma "con carta" è più naturale.', correction: 'Con carta, per favore.' },
      { text: 'Uso la mia carta per pagare adesso.', quality: 'awkward', feedback: 'Troppo lungo per la cassa.', correction: 'Pago con carta, per favore.' },
    ]},
    { id: 'survival-it-07', npc_message: 'Prenda due compresse con acqua ogni sei ore.', npc_mood: 'neutral', options: [
      { text: 'Capito — due compresse ogni sei ore. Grazie.', quality: 'good', feedback: 'Ripetere la dose conferma che hai capito.' },
      { text: 'OK, ho capito.', quality: 'ok', feedback: 'Corretto; ripetere la dose sarebbe meglio.', correction: 'Va bene, due compresse ogni sei ore.' },
      { text: 'Mangio due compressa con acqua?', quality: 'awkward', feedback: 'Per medicine si dice "prendere", non "mangiare"; "compresse" al plurale.', correction: 'Prendo due compresse con acqua, giusto?' },
    ]},
    { id: 'survival-it-08', npc_message: 'Se non migliora, consulti un medico.', npc_mood: 'neutral', options: [
      { text: 'D’accordo — grazie per il consiglio.', quality: 'good', feedback: 'Naturale e riconoscente.' },
      { text: 'OK. Vado medico se continua.', quality: 'ok', feedback: 'Si capisce; serve "dal medico".', correction: 'D’accordo, andrò dal medico se non migliora.' },
      { text: 'Il medico qui è caro.', quality: 'awkward', feedback: 'Fuori tema; conferma il consiglio.', correction: 'Ho capito, grazie per l’avviso.' },
    ]},
    { id: 'survival-it-09', npc_message: 'Ha bisogno di qualcos’altro?', npc_mood: 'neutral', options: [
      { text: 'No, credo sia tutto — grazie mille.', quality: 'good', feedback: '"Credo sia tutto" chiude naturalmente lo scambio.' },
      { text: 'No, grazie.', quality: 'ok', feedback: 'Corretto ed educato.' },
      { text: 'Non voglio più cose. Ciao.', quality: 'awkward', feedback: '"Più cose" suona poco naturale.', correction: 'No, è tutto. Grazie.' },
    ]},
    { id: 'survival-it-10', npc_message: 'Buona guarigione!', npc_mood: 'happy', options: [
      { text: 'Grazie mille, molto gentile.', quality: 'good', feedback: 'Caldo e naturale.' },
      { text: 'Grazie. Arrivederci.', quality: 'ok', feedback: 'Educato, anche se un po’ asciutto.', correction: 'Grazie, buona giornata.' },
      { text: 'Sì, io miglioro anche.', quality: 'awkward', feedback: 'Non suona naturale; basta ringraziare.', correction: 'Grazie, lo spero anch’io.' },
    ]},
    { id: 'survival-it-11', npc_message: 'Mi scusi, sa dov’è il supermercato più vicino?', npc_mood: 'neutral', options: [
      { text: 'Certo — ce n’è uno all’angolo, a due minuti.', quality: 'good', feedback: '"All’angolo" è un’indicazione concreta e naturale.' },
      { text: 'Supermercato vicino qui.', quality: 'ok', feedback: 'Si capisce; manca la struttura.', correction: 'C’è un supermercato qui vicino.' },
      { text: 'Non lo so. Forse lì.', quality: 'awkward', feedback: 'Se non sei sicuro, meglio dirlo chiaramente.', correction: 'Non sono sicuro, mi dispiace.' },
    ]},
    { id: 'survival-it-12', npc_message: 'Qualcuno parla italiano? Ho bisogno di aiuto con il telefono.', npc_mood: 'neutral', scene_complete: true, options: [
      { text: 'Io parlo italiano — qual è il problema?', quality: 'good', feedback: 'Naturale, diretto e utile.' },
      { text: 'Sì. Che problema?', quality: 'ok', feedback: 'Funziona, ma la frase completa è più naturale.', correction: 'Sì, parlo italiano — che problema ha il telefono?' },
      { text: 'Io italiano anche. Telefono problema?', quality: 'awkward', feedback: 'Telegrafico; forma una domanda completa.', correction: 'Parlo italiano — qual è il problema con il telefono?' },
    ]},
  ],
};

// ─── Café · English ──────────────────────────────────────────────────────────

const cafeEn: ScenarioDialogue = {
  stageType: 'cafe',
  language: 'en',
  sessionSize: 5,
  turns: [
    {
      id: 'cafe-en-01',
      npc_message: 'Hi there! What can I get started for you?',
      npc_mood: 'happy',
      options: [
        { text: 'Could I get a flat white, please?', quality: 'good', feedback: 'Perfect — polite, natural, native-level phrasing.' },
        { text: 'I want a coffee.', quality: 'ok', feedback: 'Clear but a bit abrupt. Adding "please" softens it.', correction: 'I\'ll have a coffee, please.' },
        { text: 'Give me flat white.', quality: 'awkward', feedback: 'Missing article and sounds like a command.', correction: 'Could I get a flat white, please?' },
      ],
    },
    {
      id: 'cafe-en-02',
      npc_message: 'What size would you like — small, medium, or large?',
      npc_mood: 'neutral',
      options: [
        { text: 'Medium, please.', quality: 'good', feedback: 'Short and perfectly natural.' },
        { text: 'The middle one.', quality: 'ok', feedback: 'Understood but slightly informal.', correction: 'Medium, please.' },
        { text: 'Not big, not small.', quality: 'awkward', feedback: 'Roundabout — just name the size directly.', correction: 'Medium, please.' },
      ],
    },
    {
      id: 'cafe-en-03',
      npc_message: 'Would you like anything to eat with that?',
      npc_mood: 'happy',
      options: [
        { text: 'No thanks, just the coffee.', quality: 'good', feedback: 'Polite refusal — exactly right.' },
        { text: 'No food.', quality: 'ok', feedback: 'Gets the message across but blunt.', correction: 'No thanks, just the drink.' },
        { text: 'I don\'t want food things.', quality: 'awkward', feedback: '"Food things" sounds unnatural.', correction: 'No thank you, just the coffee.' },
      ],
    },
    {
      id: 'cafe-en-04',
      npc_message: 'Is that for here or to go?',
      npc_mood: 'neutral',
      options: [
        { text: 'To go, please.', quality: 'good', feedback: 'Classic, correct response.' },
        { text: 'I take away.', quality: 'ok', feedback: '"Take away" is British English but missing "I\'ll".', correction: 'I\'ll take it to go.' },
        { text: 'Outside drink.', quality: 'awkward', feedback: 'Not standard — "to go" or "takeaway" are the right phrases.', correction: 'To go, please.' },
      ],
    },
    {
      id: 'cafe-en-05',
      npc_message: 'Can I get a name for the order?',
      npc_mood: 'neutral',
      options: [
        { text: 'It\'s Alex.', quality: 'good', feedback: 'Smooth and natural.' },
        { text: 'My name is Alexander.', quality: 'ok', feedback: 'A bit formal for a coffee shop, but fine.', correction: 'Alex is fine.' },
        { text: 'Write Alex on cup.', quality: 'awkward', feedback: 'Missing articles and sounds commanding.', correction: 'Just Alex, please.' },
      ],
    },
    {
      id: 'cafe-en-06',
      npc_message: 'That\'ll be four fifty. Cash or card?',
      npc_mood: 'neutral',
      options: [
        { text: 'Card, please.', quality: 'good', feedback: 'Simple and perfectly natural.' },
        { text: 'I pay by card.', quality: 'ok', feedback: 'Understood but a bit stiff — "by card" is less common in spoken English.', correction: 'Card, thanks.' },
        { text: 'Plastic money.', quality: 'awkward', feedback: 'Overly creative — just say "card".', correction: 'Card, please.' },
      ],
    },
    {
      id: 'cafe-en-07',
      npc_message: 'Do you have our loyalty card?',
      npc_mood: 'happy',
      options: [
        { text: 'No, but I\'d love to sign up.', quality: 'good', feedback: 'Natural and shows engagement.' },
        { text: 'No, I don\'t have it.', quality: 'ok', feedback: 'Correct but a bit flat.', correction: 'Not yet — can I get one?' },
        { text: 'What is loyalty card?', quality: 'awkward', feedback: 'Missing article "a" — "What is a loyalty card?"', correction: 'No, what is a loyalty card?' },
      ],
    },
    {
      id: 'cafe-en-08',
      npc_message: 'Your order will be ready in about three minutes.',
      npc_mood: 'neutral',
      options: [
        { text: 'Great, I\'ll wait over there.', quality: 'good', feedback: 'Natural and considerate.' },
        { text: 'OK, I wait.', quality: 'ok', feedback: 'Understood — "I\'ll wait" is more natural than present simple here.', correction: 'OK, I\'ll wait here.' },
        { text: 'Three minutes is long time.', quality: 'awkward', feedback: 'Missing article — "a long time". Also a bit rude.', correction: 'No worries, I\'ll wait.' },
      ],
    },
    {
      id: 'cafe-en-09',
      npc_message: 'One flat white for Alex!',
      npc_mood: 'happy',
      options: [
        { text: 'That\'s me — thank you!', quality: 'good', feedback: 'Warm and natural.' },
        { text: 'Yes, it\'s me.', quality: 'ok', feedback: 'A bit stiff but correct.', correction: 'That\'s mine, thanks!' },
        { text: 'I am Alex, give to me.', quality: 'awkward', feedback: '"Give to me" sounds demanding.', correction: 'That\'s me, thank you!' },
      ],
    },
    {
      id: 'cafe-en-10',
      npc_message: 'Enjoy your coffee! Have a great day.',
      npc_mood: 'happy',
      options: [
        { text: 'Thanks, you too!', quality: 'good', feedback: 'Perfect warm closing.' },
        { text: 'Thank you.', quality: 'ok', feedback: 'Polite but returning "you too" is friendlier.', correction: 'Thank you, have a good one!' },
        { text: 'Bye bye bye.', quality: 'awkward', feedback: 'Repetition sounds odd — one "bye" or "see you" is enough.', correction: 'Thanks, see you!' },
      ],
    },
    {
      id: 'cafe-en-11',
      npc_message: 'Sorry, we\'re out of oat milk today. Would almond milk work?',
      npc_mood: 'neutral',
      options: [
        { text: 'Sure, almond milk is fine.', quality: 'good', feedback: 'Flexible and natural.' },
        { text: 'OK, almond.', quality: 'ok', feedback: 'Clear but very telegraphic.', correction: 'Almond milk works, thanks.' },
        { text: 'I don\'t like but OK.', quality: 'awkward', feedback: 'Grammatically incomplete — say "I\'m not a big fan but that\'s fine."', correction: 'Not my favourite, but that works.' },
      ],
    },
    {
      id: 'cafe-en-12',
      npc_message: 'We have a special today — buy one get one free on pastries.',
      npc_mood: 'happy',
      options: [
        { text: 'Oh nice! I\'ll grab a croissant then.', quality: 'good', feedback: '"Grab" is natural spoken English — sounds like a local.', correction: undefined },
        { text: 'OK give me one pastry.', quality: 'ok', feedback: '"Give me" is blunt — "I\'ll take one" is friendlier.', correction: 'I\'ll take a croissant, thanks.' },
        { text: 'Two for free? I take two.', quality: 'awkward', feedback: 'Sounds greedy and ungrammatical — "I\'ll take two" is better.', correction: 'Great, I\'ll take two then!' },
      ],
    },
  ],
};

// ─── Travel · English ─────────────────────────────────────────────────────────

const travelEn: ScenarioDialogue = {
  stageType: 'travel',
  language: 'en',
  sessionSize: 5,
  turns: [
    {
      id: 'travel-en-01',
      npc_message: 'Good morning! Where are you headed today?',
      npc_mood: 'happy',
      options: [
        { text: 'I\'m heading to Edinburgh, please.', quality: 'good', feedback: 'Clear and polite — exactly right.' },
        { text: 'Edinburgh.', quality: 'ok', feedback: 'Understood but a little abrupt.', correction: 'Edinburgh, please.' },
        { text: 'I go Edinburgh.', quality: 'awkward', feedback: 'Missing "to" — "I\'m going to Edinburgh."', correction: 'I\'m going to Edinburgh.' },
      ],
    },
    {
      id: 'travel-en-02',
      npc_message: 'Would you like a window or aisle seat?',
      npc_mood: 'neutral',
      options: [
        { text: 'Window, please — I love the views.', quality: 'good', feedback: 'Natural with a nice personal touch.' },
        { text: 'Window seat.', quality: 'ok', feedback: 'Fine but adding "please" is standard courtesy.', correction: 'Window seat, please.' },
        { text: 'I sit near window.', quality: 'awkward', feedback: '"I\'d like to sit by the window" is more natural.', correction: 'By the window, please.' },
      ],
    },
    {
      id: 'travel-en-03',
      npc_message: 'Do you have any luggage to check in?',
      npc_mood: 'neutral',
      options: [
        { text: 'Yes, one suitcase please.', quality: 'good', feedback: 'Perfect — clear and polite.' },
        { text: 'I have one bag.', quality: 'ok', feedback: 'Correct but "I\'d like to check in one bag" is more natural in this context.', correction: 'Just one bag to check in.' },
        { text: 'My bag is big one.', quality: 'awkward', feedback: '"Big one" sounds odd — describe it normally.', correction: 'Yes, one large suitcase.' },
      ],
    },
    {
      id: 'travel-en-04',
      npc_message: 'Your train is on platform 3. It departs in 12 minutes.',
      npc_mood: 'neutral',
      options: [
        { text: 'Thanks — is that far from here?', quality: 'good', feedback: 'Practical follow-up question — very natural.' },
        { text: 'OK, platform 3.', quality: 'ok', feedback: 'Repeating to confirm is fine — slightly flat though.', correction: 'Got it, platform 3 — thank you!' },
        { text: 'I must run fast now?', quality: 'awkward', feedback: 'Unusual phrasing — "Should I hurry?" is the natural question.', correction: 'Thanks! Should I hurry?' },
      ],
    },
    {
      id: 'travel-en-05',
      npc_message: 'Excuse me, is this seat taken?',
      npc_mood: 'neutral',
      options: [
        { text: 'No, please go ahead.', quality: 'good', feedback: 'Warm and perfectly natural.' },
        { text: 'No, it is free.', quality: 'ok', feedback: 'Correct — "it\'s free" or "it\'s empty" both work.', correction: 'No, it\'s free — please sit down.' },
        { text: 'Nobody here. Sit.', quality: 'awkward', feedback: 'Too blunt — add "please" at minimum.', correction: 'No, go ahead!' },
      ],
    },
    {
      id: 'travel-en-06',
      npc_message: 'The ticket inspector is coming. Do you have your ticket?',
      npc_mood: 'neutral',
      options: [
        { text: 'Yes, I have it right here.', quality: 'good', feedback: 'Confident and natural.' },
        { text: 'Yes, I have.', quality: 'ok', feedback: 'Missing the object — "I have it" is complete.', correction: 'Yes, I have it.' },
        { text: 'My ticket is in phone.', quality: 'awkward', feedback: '"On my phone" not "in phone" — and add "it\'s".', correction: 'It\'s on my phone.' },
      ],
    },
    {
      id: 'travel-en-07',
      npc_message: 'I\'m sorry, this train is delayed by 20 minutes.',
      npc_mood: 'neutral',
      options: [
        { text: 'That\'s alright — will I still make my connection?', quality: 'good', feedback: 'Practical and polite — great real-life question.' },
        { text: 'OK. I wait.', quality: 'ok', feedback: 'Correct — "I\'ll wait" is a bit more natural though.', correction: 'OK, I\'ll wait.' },
        { text: 'Why delay always happen?', quality: 'awkward', feedback: 'Grammar issues — "Why does this always happen?" is correct.', correction: 'Why does this always happen?' },
      ],
    },
    {
      id: 'travel-en-08',
      npc_message: 'Next stop: Edinburgh Waverley. Doors open on the right.',
      npc_mood: 'neutral',
      options: [
        { text: 'Thank you, that\'s my stop!', quality: 'good', feedback: 'Natural and enthusiastic.' },
        { text: 'Good. I get off here.', quality: 'ok', feedback: 'Correct — "I\'ll get off here" uses the future form more naturally.', correction: 'Great, I\'ll get off here.' },
        { text: 'Yes this is my city.', quality: 'awkward', feedback: '"This is my stop" is the correct expression, not "my city".', correction: 'This is my stop!' },
      ],
    },
    {
      id: 'travel-en-09',
      npc_message: 'Welcome to Edinburgh! Can I help you find your way?',
      npc_mood: 'happy',
      options: [
        { text: 'Yes please — I\'m looking for the Old Town.', quality: 'good', feedback: 'Perfect use of "looking for" — sounds natural.' },
        { text: 'Where is castle?', quality: 'ok', feedback: 'Missing article — "where is the castle?"', correction: 'Where is the castle, please?' },
        { text: 'I am lost person.', quality: 'awkward', feedback: '"I\'m a bit lost" is the natural phrase.', correction: 'I\'m a bit lost — could you help?' },
      ],
    },
    {
      id: 'travel-en-10',
      npc_message: 'The castle is about a 15-minute walk up the Royal Mile.',
      npc_mood: 'happy',
      options: [
        { text: 'Perfect, I\'ll head that way. Thanks so much!', quality: 'good', feedback: '"Head that way" is a very natural expression.' },
        { text: 'OK, I walk there. Thank you.', quality: 'ok', feedback: 'Clear and correct — "I\'ll walk" is slightly more natural.', correction: 'OK, I\'ll walk there. Thank you!' },
        { text: '15 minute only? Easy walk.', quality: 'awkward', feedback: 'Missing articles and informal to the point of rudeness.', correction: 'Only 15 minutes? Great, thanks!' },
      ],
    },
    {
      id: 'travel-en-11',
      npc_message: 'Do you need a map of the city?',
      npc_mood: 'happy',
      options: [
        { text: 'That would be lovely, thank you.', quality: 'good', feedback: '"That would be lovely" is warm and natural British English.' },
        { text: 'Yes please, I take one.', quality: 'ok', feedback: '"I\'ll take one" is more natural than present simple here.', correction: 'Yes please, I\'ll take one.' },
        { text: 'Map? Yes. Give.', quality: 'awkward', feedback: 'Very telegraphic — sounds robotic.', correction: 'Yes, please!' },
      ],
    },
    {
      id: 'travel-en-12',
      npc_message: 'Have a wonderful visit! Enjoy Edinburgh.',
      npc_mood: 'happy',
      options: [
        { text: 'Thank you so much — I can\'t wait to explore!', quality: 'good', feedback: '"I can\'t wait to explore" is enthusiastic and natural.' },
        { text: 'Thank you. Goodbye.', quality: 'ok', feedback: 'Polite but adding warmth makes it more natural.', correction: 'Thank you, I\'m really looking forward to it!' },
        { text: 'Yes, OK, bye.', quality: 'awkward', feedback: 'Flat — "yes, OK" sounds dismissive.', correction: 'Thank you, see you around!' },
      ],
    },
  ],
};

// ─── Business · English ───────────────────────────────────────────────────────

const businessEn: ScenarioDialogue = {
  stageType: 'business',
  language: 'en',
  sessionSize: 5,
  turns: [
    {
      id: 'business-en-01',
      npc_message: 'Good morning! I believe we have a meeting scheduled. I\'m Sarah Chen.',
      npc_mood: 'neutral',
      options: [
        { text: 'Good morning, Sarah. I\'m Alex — great to meet you.', quality: 'good', feedback: 'Professional and warm — exactly right for a first meeting.' },
        { text: 'Yes, hello. I am Alex.', quality: 'ok', feedback: 'Correct but a bit stiff. Adding "nice to meet you" is standard.', correction: 'Hello Sarah, I\'m Alex. Nice to meet you.' },
        { text: 'I know. We have meeting.', quality: 'awkward', feedback: 'Sounds abrupt and unfriendly for a professional introduction.', correction: 'Great to meet you, Sarah. I\'m Alex.' },
      ],
    },
    {
      id: 'business-en-02',
      npc_message: 'Can I get you anything before we start — tea, coffee?',
      npc_mood: 'happy',
      options: [
        { text: 'A coffee would be great, thank you.', quality: 'good', feedback: 'Polite and natural — "would be great" is a very natural construction.' },
        { text: 'Coffee please.', quality: 'ok', feedback: 'Clear but adding "thank you" rounds it off nicely.', correction: 'Coffee, please — thank you.' },
        { text: 'I drink coffee always.', quality: 'awkward', feedback: 'Unusual phrasing in this context.', correction: 'Coffee would be lovely, thanks.' },
      ],
    },
    {
      id: 'business-en-03',
      npc_message: 'So, let\'s get started. Could you walk us through your proposal?',
      npc_mood: 'neutral',
      options: [
        { text: 'Of course. I\'ll start with an overview of the key points.', quality: 'good', feedback: 'Confident, professional opener — sets the right tone.' },
        { text: 'OK. My proposal is good.', quality: 'ok', feedback: 'True but vague — lead with structure, not evaluation.', correction: 'Sure, I\'ll take you through the main points.' },
        { text: 'Yes, now I talk about proposal.', quality: 'awkward', feedback: '"I will talk about" is overly literal — "walk you through" matches their phrasing.', correction: 'Of course, let me walk you through it.' },
      ],
    },
    {
      id: 'business-en-04',
      npc_message: 'That\'s interesting. What\'s the timeline you\'re proposing?',
      npc_mood: 'neutral',
      options: [
        { text: 'We\'re looking at a six-month rollout, starting in Q3.', quality: 'good', feedback: '"Looking at" and "rollout" are natural business vocabulary.' },
        { text: 'Six months for everything.', quality: 'ok', feedback: 'Clear but vague on structure.', correction: 'Six months total — starting from Q3.' },
        { text: 'Time is six month, maybe more.', quality: 'awkward', feedback: 'Grammar issues — "six months" (plural) and "maybe more" is too vague.', correction: 'Around six months — potentially more depending on scope.' },
      ],
    },
    {
      id: 'business-en-05',
      npc_message: 'We\'d need to see some cost projections before we can commit.',
      npc_mood: 'neutral',
      options: [
        { text: 'Absolutely — I can have those over to you by end of week.', quality: 'good', feedback: '"Have those over to you" is natural professional English.' },
        { text: 'OK, I send numbers later.', quality: 'ok', feedback: 'Understood — "I\'ll send" is more natural and professional.', correction: 'Sure, I\'ll send the figures over by Friday.' },
        { text: 'Costs are not big problem.', quality: 'awkward', feedback: 'Dismissing their concern isn\'t professional — acknowledge it.', correction: 'Of course, I\'ll put together a detailed breakdown.' },
      ],
    },
    {
      id: 'business-en-06',
      npc_message: 'Do you have any questions for us at this stage?',
      npc_mood: 'neutral',
      options: [
        { text: 'Yes — what does your decision-making process look like from here?', quality: 'good', feedback: 'Excellent question — shows strategic thinking.' },
        { text: 'No questions. Everything is clear.', quality: 'ok', feedback: 'Polite but asking a question shows engagement and initiative.', correction: 'Actually, yes — what are the next steps on your side?' },
        { text: 'When you give answer yes or no?', quality: 'awkward', feedback: 'Too blunt — "What is your timeline for a decision?" is the professional phrasing.', correction: 'When might we expect a decision?' },
      ],
    },
    {
      id: 'business-en-07',
      npc_message: 'We have some concerns about the scalability of the solution.',
      npc_mood: 'neutral',
      options: [
        { text: 'That\'s a fair concern — let me address that directly.', quality: 'good', feedback: 'Acknowledging concerns before responding is strong meeting etiquette.' },
        { text: 'OK, I explain about scalability.', quality: 'ok', feedback: 'Clear intent — "let me explain" is more natural than "I explain."', correction: 'Good point — let me explain how we\'ve addressed that.' },
        { text: 'Scalability is not problem, trust me.', quality: 'awkward', feedback: '"Trust me" undermines credibility in a business context — show, don\'t tell.', correction: 'That\'s a valid concern — here\'s how the system handles scale.' },
      ],
    },
    {
      id: 'business-en-08',
      npc_message: 'Could you share some references from similar projects?',
      npc_mood: 'neutral',
      options: [
        { text: 'Certainly — I\'ll include three case studies in my follow-up email.', quality: 'good', feedback: 'Specific and professional — committing to a follow-up is strong.' },
        { text: 'Yes, I have references. I send.', quality: 'ok', feedback: '"I\'ll send" is more natural — avoid dropping "will."', correction: 'Yes, I\'ll send over some references.' },
        { text: 'I have many happy clients.', quality: 'awkward', feedback: 'Vague and sounds like a sales pitch, not a factual answer.', correction: 'Of course — I\'ll share a few relevant case studies.' },
      ],
    },
    {
      id: 'business-en-09',
      npc_message: 'I think we\'ve covered the main points. Shall we wrap up?',
      npc_mood: 'neutral',
      options: [
        { text: 'Yes — I\'ll send a summary of the action points this afternoon.', quality: 'good', feedback: 'Taking initiative to send a follow-up summary is excellent professional practice.' },
        { text: 'OK, meeting finish.', quality: 'ok', feedback: '"The meeting is finished" or "Let\'s wrap up" — "meeting finish" is incomplete.', correction: 'Yes, let\'s wrap up — I\'ll follow up with notes.' },
        { text: 'Yes, we talk enough.', quality: 'awkward', feedback: '"Talk enough" sounds like you\'re tired of the meeting — not a professional note to end on.', correction: 'I think so — thank you for your time.' },
      ],
    },
    {
      id: 'business-en-10',
      npc_message: 'Thank you for coming in. We\'ll be in touch.',
      npc_mood: 'neutral',
      options: [
        { text: 'Thank you, Sarah. I look forward to hearing from you.', quality: 'good', feedback: '"Look forward to hearing from you" is the classic professional sign-off.' },
        { text: 'OK. Goodbye.', quality: 'ok', feedback: 'Polite but a little flat — adding "thank you" warms it up.', correction: 'Thank you very much. Goodbye.' },
        { text: 'Yes, you call me.', quality: 'awkward', feedback: 'Overly casual and slightly presumptuous.', correction: 'Thank you — I\'ll wait to hear from you.' },
      ],
    },
    {
      id: 'business-en-11',
      npc_message: 'One last thing — are you available for a follow-up call next Tuesday?',
      npc_mood: 'neutral',
      options: [
        { text: 'Tuesday works for me — morning or afternoon?', quality: 'good', feedback: 'Confirms availability and moves the conversation forward efficiently.' },
        { text: 'Yes, I can Tuesday.', quality: 'ok', feedback: '"I\'m free on Tuesday" is more natural.', correction: 'Yes, Tuesday works for me.' },
        { text: 'Tuesday is OK maybe.', quality: 'awkward', feedback: '"Maybe" sounds uncertain — either confirm or suggest an alternative.', correction: 'Tuesday is fine — what time suits you?' },
      ],
    },
    {
      id: 'business-en-12',
      npc_message: 'We\'ll send a calendar invite. Safe travels back.',
      npc_mood: 'happy',
      options: [
        { text: 'Thank you — I\'ll keep an eye out for it. Have a great day!', quality: 'good', feedback: '"Keep an eye out for it" is natural and warm.' },
        { text: 'OK. Bye.', quality: 'ok', feedback: 'Polite — just a bit short for a business close.', correction: 'Thank you, have a great day!' },
        { text: 'Good. Send to my email.', quality: 'awkward', feedback: 'Sounds like an order — they\'ll send to the right address already.', correction: 'Perfect, I\'ll watch out for it. Thanks!' },
      ],
    },
  ],
};

// ─── Social · English ─────────────────────────────────────────────────────────

const socialEn: ScenarioDialogue = {
  stageType: 'social',
  language: 'en',
  sessionSize: 5,
  turns: [
    {
      id: 'social-en-01',
      npc_message: 'Hey! I don\'t think we\'ve met — I\'m Jamie.',
      npc_mood: 'happy',
      options: [
        { text: 'Hey Jamie! I\'m Alex — nice to meet you.', quality: 'good', feedback: 'Warm and natural — matching their casual energy is key.' },
        { text: 'Hello. I am Alex.', quality: 'ok', feedback: 'A little formal for a casual social setting.', correction: 'Hi! I\'m Alex — good to meet you.' },
        { text: 'I never see you before. Alex.', quality: 'awkward', feedback: 'Odd phrasing — "nice to meet you" is the natural opener.', correction: 'Nice to meet you, Jamie — I\'m Alex.' },
      ],
    },
    {
      id: 'social-en-02',
      npc_message: 'How do you know the host?',
      npc_mood: 'happy',
      options: [
        { text: 'We went to university together — how about you?', quality: 'good', feedback: 'Answering and returning the question is the natural social move.' },
        { text: 'University. And you?', quality: 'ok', feedback: 'Short but clear — a full sentence would sound more engaged.', correction: 'We went to uni together. How do you know them?' },
        { text: 'From the university I was going.', quality: 'awkward', feedback: 'Unusual word order — "We met at university" is natural.', correction: 'We met at university. You?' },
      ],
    },
    {
      id: 'social-en-03',
      npc_message: 'What do you do for work?',
      npc_mood: 'neutral',
      options: [
        { text: 'I\'m in marketing — what about you?', quality: 'good', feedback: '"I\'m in [field]" is the natural casual phrasing.' },
        { text: 'I work in marketing job.', quality: 'ok', feedback: '"Job" is redundant — "I work in marketing" is enough.', correction: 'I work in marketing. What about you?' },
        { text: 'My job is about marketing things.', quality: 'awkward', feedback: '"Marketing things" is vague — name the field directly.', correction: 'I\'m in marketing. You?' },
      ],
    },
    {
      id: 'social-en-04',
      npc_message: 'Nice! I\'m a freelance photographer. Do you take many photos?',
      npc_mood: 'happy',
      options: [
        { text: 'Mostly on my phone — nothing as impressive as a professional though!', quality: 'good', feedback: 'Humble, relatable and naturally conversational.' },
        { text: 'Yes, I take photos sometimes.', quality: 'ok', feedback: 'Fine but a bit flat — adding detail makes conversation flow better.', correction: 'Just casual stuff on my phone, nothing serious.' },
        { text: 'I am not professional like you.', quality: 'awkward', feedback: 'Correct but the self-deprecation is a bit sudden.', correction: 'Just on my phone — you must have a proper camera though?' },
      ],
    },
    {
      id: 'social-en-05',
      npc_message: 'Are you local or did you come from far?',
      npc_mood: 'neutral',
      options: [
        { text: 'I\'m local — born and raised here actually.', quality: 'good', feedback: '"Born and raised" is a natural idiom that sounds fluent.' },
        { text: 'I live here. I am local.', quality: 'ok', feedback: 'Clear but a little repetitive.', correction: 'Yeah, I live here — I\'m local.' },
        { text: 'I am from here city.', quality: 'awkward', feedback: '"Here city" isn\'t correct — "I\'m from here" or "I\'m a local."', correction: 'I\'m from here, yeah.' },
      ],
    },
    {
      id: 'social-en-06',
      npc_message: 'Have you tried the food here? It\'s amazing.',
      npc_mood: 'happy',
      options: [
        { text: 'Not yet — what do you recommend?', quality: 'good', feedback: 'Asking for a recommendation invites more conversation naturally.' },
        { text: 'No, not yet. What is good?', quality: 'ok', feedback: 'Clear — "what\'s good?" is the spoken shortcut.', correction: 'Not yet — what\'s good?' },
        { text: 'I did not eat here foods.', quality: 'awkward', feedback: '"Here foods" is unnatural — "the food here" is correct.', correction: 'Not yet — what should I try?' },
      ],
    },
    {
      id: 'social-en-07',
      npc_message: 'You have to try the bruschetta — seriously, it\'s incredible.',
      npc_mood: 'happy',
      options: [
        { text: 'Sold! I\'ll grab some now.', quality: 'good', feedback: '"Sold!" is a great casual expression — sounds natural and enthusiastic.' },
        { text: 'OK, I will try it.', quality: 'ok', feedback: 'Correct and natural — just slightly less lively.', correction: 'Sounds good — I\'ll go get some!' },
        { text: 'Yes I eat bruschetta now.', quality: 'awkward', feedback: '"I eat" should be "I\'ll eat" or "I\'ll go try some."', correction: 'I\'ll definitely try some!' },
      ],
    },
    {
      id: 'social-en-08',
      npc_message: 'Are you staying for the whole evening?',
      npc_mood: 'neutral',
      options: [
        { text: 'I think so — I\'ve got nowhere to be!', quality: 'good', feedback: '"I\'ve got nowhere to be" is a great casual expression.' },
        { text: 'Yes, I stay all night.', quality: 'ok', feedback: '"All night" might sound odd for a house party — "all evening" is better.', correction: 'Yes, I\'m planning to stay the whole evening.' },
        { text: 'I don\'t know if I stay late.', quality: 'awkward', feedback: 'Correct but slightly negative — "I\'m planning to stay" is more sociable.', correction: 'I think so — depends how the night goes!' },
      ],
    },
    {
      id: 'social-en-09',
      npc_message: 'We should swap numbers — I know some good spots for photos if you\'re interested.',
      npc_mood: 'happy',
      options: [
        { text: 'Definitely! I\'d love that.', quality: 'good', feedback: '"I\'d love that" is warm and enthusiastic.' },
        { text: 'Yes, good idea. Here is my number.', quality: 'ok', feedback: 'Clear and direct — fine in a casual setting.', correction: 'Yeah, great idea! Here you go.' },
        { text: 'OK you can have my telephone.', quality: 'awkward', feedback: '"My number" not "my telephone" — the phrasing is dated.', correction: 'Sure! Here\'s my number.' },
      ],
    },
    {
      id: 'social-en-10',
      npc_message: 'It was really nice talking to you!',
      npc_mood: 'happy',
      options: [
        { text: 'You too! Let\'s definitely catch up again.', quality: 'good', feedback: '"Catch up" is a natural social expression — sounds like a local.' },
        { text: 'Yes, nice talking. Goodbye.', quality: 'ok', feedback: 'Polite but a bit abrupt — "see you around" sounds warmer.', correction: 'Nice chatting — see you around!' },
        { text: 'I like this conversation with you.', quality: 'awkward', feedback: 'Slightly formal for a casual goodbye.', correction: 'You too — it was great meeting you!' },
      ],
    },
    {
      id: 'social-en-11',
      npc_message: 'Have you been to any good events lately?',
      npc_mood: 'happy',
      options: [
        { text: 'Actually yes — there was a great live music night last week.', quality: 'good', feedback: 'Specific and engaging — gives the conversation something to build on.' },
        { text: 'Yes, some events. They were OK.', quality: 'ok', feedback: 'A bit vague — adding a detail makes it more conversational.', correction: 'A few — there was a good gig last week actually.' },
        { text: 'I went to event of music recently.', quality: 'awkward', feedback: '"A music event" is the natural phrasing.', correction: 'Yeah, I went to a music event last week.' },
      ],
    },
    {
      id: 'social-en-12',
      npc_message: 'You should come to our photography walk next Sunday if you\'re free.',
      npc_mood: 'happy',
      options: [
        { text: 'That sounds brilliant — count me in!', quality: 'good', feedback: '"Count me in!" is enthusiastic and very natural.' },
        { text: 'OK, I come if I am free.', quality: 'ok', feedback: '"If I\'m free" is correct — "I\'ll come if I\'m free" is slightly more natural.', correction: 'I\'d love to — I\'ll check my diary.' },
        { text: 'Photography walk? What is that exactly?', quality: 'awkward', feedback: 'Asking for clarification is fine, but the tone is a bit flat.', correction: 'A photography walk — that sounds fun! Tell me more.' },
      ],
    },
  ],
};

// ─── Survival · English ───────────────────────────────────────────────────────

const survivalEn: ScenarioDialogue = {
  stageType: 'survival',
  language: 'en',
  sessionSize: 5,
  turns: [
    {
      id: 'survival-en-01',
      npc_message: 'Excuse me — do you need any help?',
      npc_mood: 'neutral',
      options: [
        { text: 'Yes please — I\'m a bit lost.', quality: 'good', feedback: '"A bit lost" is the natural, understated British way to say this.' },
        { text: 'Yes, I am lost.', quality: 'ok', feedback: 'Clear and correct.', correction: 'Yes, I\'m lost — could you help me?' },
        { text: 'I don\'t know where I am go.', quality: 'awkward', feedback: '"I don\'t know where I\'m going" or "I\'m lost" are the natural phrases.', correction: 'Yes, I\'m not sure where I\'m going.' },
      ],
    },
    {
      id: 'survival-en-02',
      npc_message: 'Are you OK? You look like you might need some help.',
      npc_mood: 'neutral',
      options: [
        { text: 'I\'m fine, thanks — I just need to find the nearest pharmacy.', quality: 'good', feedback: 'Clear, natural and gets straight to the point.' },
        { text: 'I need pharmacy.', quality: 'ok', feedback: 'Understood — "I need a pharmacy" or "I\'m looking for a pharmacy" is more complete.', correction: 'I\'m looking for a pharmacy.' },
        { text: 'I search for medicine shop.', quality: 'awkward', feedback: '"Medicine shop" is not used — it\'s "pharmacy" or "chemist\'s" in British English.', correction: 'I need to find a pharmacy, please.' },
      ],
    },
    {
      id: 'survival-en-03',
      npc_message: 'What seems to be the problem?',
      npc_mood: 'neutral',
      options: [
        { text: 'I\'ve got a really bad headache — do you have anything for pain?', quality: 'good', feedback: '"I\'ve got" + "anything for pain" is natural pharmacy language.' },
        { text: 'I have headache. Give me medicine.', quality: 'ok', feedback: '"Give me" is too direct — "Could I get something for a headache?" is polite.', correction: 'I have a headache — could you recommend something?' },
        { text: 'My head is having pain inside.', quality: 'awkward', feedback: 'Overly descriptive — "I have a headache" is all you need.', correction: 'I have a bad headache.' },
      ],
    },
    {
      id: 'survival-en-04',
      npc_message: 'Have you taken anything for it already?',
      npc_mood: 'neutral',
      options: [
        { text: 'No, not yet — that\'s why I came in.', quality: 'good', feedback: 'Natural and explains the situation clearly.' },
        { text: 'No. Nothing.', quality: 'ok', feedback: 'Clear — a full sentence is slightly better in this context.', correction: 'No, nothing yet.' },
        { text: 'I did not take pills before coming here.', quality: 'awkward', feedback: 'Technically correct but sounds robotic — "no, not yet" is all you need.', correction: 'No, not yet.' },
      ],
    },
    {
      id: 'survival-en-05',
      npc_message: 'I\'d recommend ibuprofen — are you allergic to anything?',
      npc_mood: 'neutral',
      options: [
        { text: 'Not that I know of.', quality: 'good', feedback: '"Not that I know of" is a perfectly natural way to say you have no known allergies.' },
        { text: 'No allergies.', quality: 'ok', feedback: 'Clear and correct.', correction: 'No, I don\'t have any allergies.' },
        { text: 'I am not know about allergies.', quality: 'awkward', feedback: '"I don\'t know about allergies" — or more naturally, "not that I know of."', correction: 'Not that I know of.' },
      ],
    },
    {
      id: 'survival-en-06',
      npc_message: 'That will be £4.50, please.',
      npc_mood: 'neutral',
      options: [
        { text: 'Here you go. Can I pay by card?', quality: 'good', feedback: '"Here you go" is natural — offering the card before they ask shows awareness.' },
        { text: 'OK. Card please.', quality: 'ok', feedback: 'Understood — short but effective.', correction: 'Card, please.' },
        { text: 'I pay. Card. Thank you.', quality: 'awkward', feedback: 'Too fragmented — string the words into a sentence.', correction: 'I\'ll pay by card, please.' },
      ],
    },
    {
      id: 'survival-en-07',
      npc_message: 'Take two tablets with water, every four to six hours.',
      npc_mood: 'neutral',
      options: [
        { text: 'Got it — two tablets, every four to six hours. Thanks.', quality: 'good', feedback: 'Repeating back instructions shows you understood — excellent in medical contexts.' },
        { text: 'OK. I understand.', quality: 'ok', feedback: 'Fine — repeating the dose back is even better.', correction: 'Got it. Two tablets every few hours.' },
        { text: 'I eat two tablet with water yes?', quality: 'awkward', feedback: '"Take" not "eat" — and use "tablets" (plural always).', correction: 'Two tablets with water, understood.' },
      ],
    },
    {
      id: 'survival-en-08',
      npc_message: 'If it doesn\'t improve, please see a doctor.',
      npc_mood: 'neutral',
      options: [
        { text: 'Will do — thank you for the advice.', quality: 'good', feedback: '"Will do" is natural British English for "I will."' },
        { text: 'OK. I go doctor if problem continues.', quality: 'ok', feedback: '"I\'ll see a doctor" is more natural than "I go doctor."', correction: 'OK, I\'ll see a doctor if it gets worse.' },
        { text: 'Doctor is expensive here.', quality: 'awkward', feedback: 'Mentioning cost instead of confirming is an off-topic response.', correction: 'I will, thanks for letting me know.' },
      ],
    },
    {
      id: 'survival-en-09',
      npc_message: 'Do you need anything else today?',
      npc_mood: 'neutral',
      options: [
        { text: 'I think that\'s everything — thanks so much!', quality: 'good', feedback: '"I think that\'s everything" is very natural.' },
        { text: 'No, that is all. Thank you.', quality: 'ok', feedback: 'Clear and polite.', correction: 'No, that\'s all. Thank you very much.' },
        { text: 'No more things. Bye.', quality: 'awkward', feedback: '"No more things" is unusual — "that\'s all" or "nothing else" is correct.', correction: 'No, that\'s everything. Thanks.' },
      ],
    },
    {
      id: 'survival-en-10',
      npc_message: 'I hope you feel better soon!',
      npc_mood: 'happy',
      options: [
        { text: 'Thank you — I\'m sure I will with these!', quality: 'good', feedback: 'Warm and natural — acknowledges their kindness.' },
        { text: 'Thank you. Goodbye.', quality: 'ok', feedback: 'Polite but a tiny bit flat for a warm send-off.', correction: 'Thank you, I appreciate it. Take care!' },
        { text: 'Yes I hope too. Bye.', quality: 'awkward', feedback: '"I hope too" is literal translation — "I hope so too" is correct.', correction: 'I hope so too! Thank you.' },
      ],
    },
    {
      id: 'survival-en-11',
      npc_message: 'Excuse me, could you tell me where the nearest supermarket is?',
      npc_mood: 'neutral',
      options: [
        { text: 'Of course — there\'s one just around the corner on the high street.', quality: 'good', feedback: '"Just around the corner" is a natural, helpful locator.' },
        { text: 'Supermarket is near here.', quality: 'ok', feedback: '"There\'s one near here" is more natural.', correction: 'There\'s one nearby — just down the road.' },
        { text: 'I don\'t know. Maybe that way.', quality: 'awkward', feedback: 'If unsure, "I\'m not sure, sorry" is more natural than "maybe that way."', correction: 'I\'m not certain — I think there might be one down that way.' },
      ],
    },
    {
      id: 'survival-en-12',
      npc_message: 'Does anyone here speak English? I need help with my phone.',
      npc_mood: 'neutral',
      options: [
        { text: 'I do — what\'s the issue? Maybe I can help.', quality: 'good', feedback: '"What\'s the issue?" is a natural, helpful opener.' },
        { text: 'Yes. What problem you have?', quality: 'ok', feedback: '"What problem do you have?" — word order matters in questions.', correction: 'Yes, I do — what\'s wrong with it?' },
        { text: 'I speak English also. Phone problem?', quality: 'awkward', feedback: 'Telegraphic — form a proper question.', correction: 'I speak English — what\'s the problem with your phone?' },
      ],
    },
  ],
};

// ─── Café · Portuguese ────────────────────────────────────────────────────────

const cafePt: ScenarioDialogue = {
  stageType: 'cafe',
  language: 'pt',
  sessionSize: 5,
  turns: [
    {
      id: 'cafe-pt-01',
      npc_message: 'Bom dia! O que vai ser?',
      npc_mood: 'happy',
      options: [
        { text: 'Um café com leite, por favor.', quality: 'good', feedback: 'Perfeito — pedido natural e educado.' },
        { text: 'Quero um café.', quality: 'ok', feedback: 'Entendido, mas "por favor" suaviza o tom.', correction: 'Um café, por favor.' },
        { text: 'Me dá um café.', quality: 'awkward', feedback: '"Me dá" é direto demais para um balcão formal — prefira "por favor."', correction: 'Um café, por favor.' },
      ],
    },
    {
      id: 'cafe-pt-02',
      npc_message: 'Prefere sentado ou para levar?',
      npc_mood: 'neutral',
      options: [
        { text: 'Para levar, por favor.', quality: 'good', feedback: 'Claro e natural.' },
        { text: 'Levar.', quality: 'ok', feedback: 'Compreensível, mas uma resposta mais completa soa melhor.', correction: 'Para levar, obrigado.' },
        { text: 'Eu quero ir embora com ele.', quality: 'awkward', feedback: 'Desnecessariamente longo — "para levar" é suficiente.', correction: 'Para levar, por favor.' },
      ],
    },
    {
      id: 'cafe-pt-03',
      npc_message: 'Quer alguma coisa para comer?',
      npc_mood: 'happy',
      options: [
        { text: 'Não, obrigado — só o café.', quality: 'good', feedback: 'Recusa gentil e natural.' },
        { text: 'Não quero comida.', quality: 'ok', feedback: 'Correto, mas um pouco seco.', correction: 'Não, obrigado.' },
        { text: 'Eu não estou com vontade de comer coisa.', quality: 'awkward', feedback: '"Coisa" é vago — "Não, obrigado" é suficiente.', correction: 'Não, só o café, obrigado.' },
      ],
    },
    {
      id: 'cafe-pt-04',
      npc_message: 'Vai querer açúcar?',
      npc_mood: 'neutral',
      options: [
        { text: 'Sim, um sachê, por favor.', quality: 'good', feedback: '"Sachê" é o termo correto no Brasil; em Portugal, "saqueta".' },
        { text: 'Sim, coloca açúcar.', quality: 'ok', feedback: 'Compreensível, mas um "por favor" seria mais adequado.', correction: 'Sim, um pouquinho, por favor.' },
        { text: 'Eu gosto muito de açúcar então sim.', quality: 'awkward', feedback: 'Informação desnecessária — uma resposta direta basta.', correction: 'Sim, por favor.' },
      ],
    },
    {
      id: 'cafe-pt-05',
      npc_message: 'Vai querer mais alguma coisa?',
      npc_mood: 'neutral',
      options: [
        { text: 'Não, é isso mesmo. Obrigado!', quality: 'good', feedback: '"É isso mesmo" é natural e conclusivo.' },
        { text: 'Não. Tudo bem.', quality: 'ok', feedback: 'Correto, mas "obrigado" completaria melhor.', correction: 'Não, obrigado.' },
        { text: 'Acho que não preciso de mais nada agora.', quality: 'awkward', feedback: 'Muito longo para o contexto — simplifique.', correction: 'Não, obrigado, é isso.' },
      ],
    },
    {
      id: 'cafe-pt-06',
      npc_message: 'São três reais e cinquenta. Como prefere pagar?',
      npc_mood: 'neutral',
      options: [
        { text: 'No cartão, por favor.', quality: 'good', feedback: 'Natural e direto.' },
        { text: 'Cartão.', quality: 'ok', feedback: 'Funciona, mas "por favor" é mais educado.', correction: 'No cartão, por favor.' },
        { text: 'Eu pago com o meu cartão de crédito.', quality: 'awkward', feedback: 'Mais longo do que o necessário.', correction: 'No cartão, obrigado.' },
      ],
    },
    {
      id: 'cafe-pt-07',
      npc_message: 'Tem cartão fidelidade conosco?',
      npc_mood: 'happy',
      options: [
        { text: 'Não, mas adoraria ter. Como funciona?', quality: 'good', feedback: 'Demonstra interesse e mantém a conversa fluindo.' },
        { text: 'Não tenho.', quality: 'ok', feedback: 'Correto — perguntar como funciona seria ainda melhor.', correction: 'Não tenho — posso fazer um?' },
        { text: 'Não sei o que é isso.', quality: 'awkward', feedback: 'Honesto, mas perguntar "como funciona?" é mais natural.', correction: 'Não tenho — como funciona?' },
      ],
    },
    {
      id: 'cafe-pt-08',
      npc_message: 'O café fica pronto em um minutinho.',
      npc_mood: 'neutral',
      options: [
        { text: 'Perfeito, aguardo aqui.', quality: 'good', feedback: '"Aguardo aqui" é natural e confirma que vai esperar.' },
        { text: 'OK, vou esperar.', quality: 'ok', feedback: 'Correto — "aguardo" soa um pouco mais natural no contexto.', correction: 'Claro, vou aguardar aqui.' },
        { text: 'Tá bom, fico aqui parado esperando.', quality: 'awkward', feedback: '"Parado esperando" é redundante.', correction: 'Perfeito, aguardo.' },
      ],
    },
    {
      id: 'cafe-pt-09',
      npc_message: 'Aqui está o seu café!',
      npc_mood: 'happy',
      options: [
        { text: 'Muito obrigado!', quality: 'good', feedback: 'Agradecimento cálido e natural.' },
        { text: 'Obrigado.', quality: 'ok', feedback: 'Correto — "muito" intensifica o agradecimento de forma natural.', correction: 'Muito obrigado!' },
        { text: 'Boa. Pode deixar aqui.', quality: 'awkward', feedback: 'Seco e um pouco rude — "obrigado" é essencial.', correction: 'Obrigado!' },
      ],
    },
    {
      id: 'cafe-pt-10',
      npc_message: 'Bom café! Tenha um bom dia.',
      npc_mood: 'happy',
      options: [
        { text: 'Obrigado, você também!', quality: 'good', feedback: 'Retribuir o desejo é o fecho perfeito.' },
        { text: 'Obrigado. Tchau.', quality: 'ok', feedback: 'Correto — retribuir o desejo aquece mais a despedida.', correction: 'Obrigado, igualmente!' },
        { text: 'Sim sim, tchau tchau.', quality: 'awkward', feedback: 'Repetição soa desinteressado.', correction: 'Obrigado, até mais!' },
      ],
    },
    {
      id: 'cafe-pt-11',
      npc_message: 'Desculpe, acabou o leite de aveia. Quer leite normal?',
      npc_mood: 'neutral',
      options: [
        { text: 'Tudo bem, pode ser leite normal mesmo.', quality: 'good', feedback: 'Flexível e educado.' },
        { text: 'OK, normal.', quality: 'ok', feedback: 'Funciona — uma resposta mais completa é mais natural.', correction: 'Pode ser leite normal, obrigado.' },
        { text: 'Que pena. Mas tudo bem pode colocar.', quality: 'awkward', feedback: 'A frase está incompleta — "pode colocar o normal" precisaria de objeto.', correction: 'Que pena, mas tudo bem — pode ser leite normal.' },
      ],
    },
    {
      id: 'cafe-pt-12',
      npc_message: 'Temos uma promoção hoje — compre dois e leve três.',
      npc_mood: 'happy',
      options: [
        { text: 'Que ótimo! Vou aproveitar então — me dá mais dois.', quality: 'good', feedback: '"Vou aproveitar" é natural e mostra entusiasmo.' },
        { text: 'OK. Vou pegar dois cafés então.', quality: 'ok', feedback: 'Correto — "aproveitar a promoção" soa ainda mais natural.', correction: 'Vou aproveitar! Pode ser mais dois.' },
        { text: 'Promoção é bom. Eu quero mais café.', quality: 'awkward', feedback: '"Promoção é bom" está incompleto — "a promoção é boa."', correction: 'Ótimo! Então quero mais dois, por favor.' },
      ],
    },
  ],
};

// ─── Travel · Portuguese ──────────────────────────────────────────────────────

const travelPt: ScenarioDialogue = {
  stageType: 'travel',
  language: 'pt',
  sessionSize: 5,
  turns: [
    {
      id: 'travel-pt-01',
      npc_message: 'Bom dia! Para onde o senhor vai hoje?',
      npc_mood: 'happy',
      options: [
        { text: 'Vou para o Rio de Janeiro, por favor.', quality: 'good', feedback: 'Claro, educado e natural.' },
        { text: 'Rio de Janeiro.', quality: 'ok', feedback: 'Compreensível, mas um "por favor" é mais educado.', correction: 'Rio de Janeiro, por favor.' },
        { text: 'Eu preciso ir para o Rio.', quality: 'awkward', feedback: '"Vou para o Rio" é mais direto e natural neste contexto.', correction: 'Vou para o Rio, por favor.' },
      ],
    },
    {
      id: 'travel-pt-02',
      npc_message: 'Janela ou corredor?',
      npc_mood: 'neutral',
      options: [
        { text: 'Janela, por favor — adoro a vista.', quality: 'good', feedback: 'Natural com um toque pessoal que humaniza a conversa.' },
        { text: 'Janela.', quality: 'ok', feedback: '"Por favor" torna a resposta mais educada.', correction: 'Janela, por favor.' },
        { text: 'Prefiro sentar perto da janela do avião.', quality: 'awkward', feedback: 'Desnecessariamente longo — "janela, por favor" basta.', correction: 'Janela, por favor.' },
      ],
    },
    {
      id: 'travel-pt-03',
      npc_message: 'Tem bagagem para despachar?',
      npc_mood: 'neutral',
      options: [
        { text: 'Sim, uma mala, por favor.', quality: 'good', feedback: 'Resposta clara e precisa.' },
        { text: 'Tenho uma mala.', quality: 'ok', feedback: 'Correto — "para despachar" pode ser acrescentado.', correction: 'Sim, uma mala para despachar.' },
        { text: 'Eu tenho uma bolsa grande que é grande.', quality: 'awkward', feedback: 'Repetição de "grande" e "bolsa" é pouco preciso — use "mala."', correction: 'Sim, uma mala grande.' },
      ],
    },
    {
      id: 'travel-pt-04',
      npc_message: 'O trem está na plataforma dois. Parte em dez minutos.',
      npc_mood: 'neutral',
      options: [
        { text: 'Obrigado! Fica longe daqui?', quality: 'good', feedback: 'Pergunta prática e natural.' },
        { text: 'OK, plataforma dois.', quality: 'ok', feedback: 'Confirmar o número é útil — um "obrigado" completa bem.', correction: 'Entendido, plataforma dois. Obrigado!' },
        { text: 'Preciso correr muito rápido agora?', quality: 'awkward', feedback: '"Preciso me apressar?" é mais natural.', correction: 'Preciso me apressar?' },
      ],
    },
    {
      id: 'travel-pt-05',
      npc_message: 'Com licença, esse lugar está ocupado?',
      npc_mood: 'neutral',
      options: [
        { text: 'Não, pode sentar à vontade.', quality: 'good', feedback: '"À vontade" é uma expressão calorosa e natural.' },
        { text: 'Não, é livre.', quality: 'ok', feedback: 'Correto — "pode sentar" é mais acolhedor.', correction: 'Não, fique à vontade.' },
        { text: 'Ninguém aqui. Pode.', quality: 'awkward', feedback: 'Muito telegráfico — uma resposta curta com "à vontade" é melhor.', correction: 'Não, pode sentar.' },
      ],
    },
    {
      id: 'travel-pt-06',
      npc_message: 'O fiscal vai passar para ver os bilhetes.',
      npc_mood: 'neutral',
      options: [
        { text: 'Tudo bem, tenho o meu aqui.', quality: 'good', feedback: 'Natural e confiante.' },
        { text: 'Ok, tenho bilhete.', quality: 'ok', feedback: '"Tenho o meu bilhete" é mais completo.', correction: 'OK, o meu bilhete está aqui.' },
        { text: 'Eu tenho bilhete que comprei antes.', quality: 'awkward', feedback: 'Desnecessário explicar quando comprou — "tenho o meu bilhete" basta.', correction: 'Tenho o meu bilhete, sim.' },
      ],
    },
    {
      id: 'travel-pt-07',
      npc_message: 'Lamento informar — o trem está atrasado 20 minutos.',
      npc_mood: 'neutral',
      options: [
        { text: 'Tudo bem, obrigado por avisar. Vou perder a conexão?', quality: 'good', feedback: 'Reação tranquila e pergunta prática — ótimo.' },
        { text: 'OK. Vou aguardar.', quality: 'ok', feedback: 'Correto — perguntar sobre a conexão é prático.', correction: 'Tudo bem, aguardo. Vou perder a conexão?' },
        { text: 'Por que sempre tem atraso nesse país?', quality: 'awkward', feedback: 'Reclamar da situação não resolve nada — mantenha o foco no prático.', correction: 'Entendido. Vou conseguir fazer a conexão?' },
      ],
    },
    {
      id: 'travel-pt-08',
      npc_message: 'Próxima estação: Campinas. Portas abrindo à direita.',
      npc_mood: 'neutral',
      options: [
        { text: 'Obrigado, é a minha parada!', quality: 'good', feedback: 'Natural e entusiasmado.' },
        { text: 'Boa. Eu desço aqui.', quality: 'ok', feedback: '"Boa" é informal mas comum no Brasil — "obrigado" completa melhor.', correction: 'Ótimo, é a minha parada.' },
        { text: 'Sim aqui é minha cidade que eu preciso.', quality: 'awkward', feedback: 'Fraseado confuso — "é a minha parada" é suficiente.', correction: 'É a minha parada!' },
      ],
    },
    {
      id: 'travel-pt-09',
      npc_message: 'Bem-vindo! Posso ajudar com alguma informação?',
      npc_mood: 'happy',
      options: [
        { text: 'Sim — estou procurando o centro histórico.', quality: 'good', feedback: '"Estou procurando" é a forma natural para indicar busca.' },
        { text: 'Onde é o centro?', quality: 'ok', feedback: 'Direto e entendível — "por favor" tornaria mais educado.', correction: 'Onde fica o centro histórico, por favor?' },
        { text: 'Eu não sei onde está o lugar histórico.', quality: 'awkward', feedback: '"Centro histórico" é o nome correto — diga-o diretamente.', correction: 'Estou procurando o centro histórico.' },
      ],
    },
    {
      id: 'travel-pt-10',
      npc_message: 'O centro fica a uns quinze minutos a pé, pela Avenida Principal.',
      npc_mood: 'happy',
      options: [
        { text: 'Perfeito! Muito obrigado pela ajuda.', quality: 'good', feedback: '"Muito obrigado pela ajuda" é caloroso e natural.' },
        { text: 'OK, vou lá. Obrigado.', quality: 'ok', feedback: 'Correto — "obrigado pela ajuda" soa mais grato.', correction: 'Ótimo, obrigado!' },
        { text: '15 minuto só? Isso é fácil para mim.', quality: 'awkward', feedback: '"15 minutos" (plural) e "é fácil" sem o acréscimo necessário.', correction: 'Só 15 minutos? Ótimo, obrigado!' },
      ],
    },
    {
      id: 'travel-pt-11',
      npc_message: 'Quer um mapa da cidade?',
      npc_mood: 'happy',
      options: [
        { text: 'Sim, por favor — seria muito útil!', quality: 'good', feedback: '"Seria muito útil" é natural e agradecido.' },
        { text: 'Sim, me dá um.', quality: 'ok', feedback: '"Por favor" torna o pedido mais educado.', correction: 'Sim, por favor!' },
        { text: 'Pode dar mapa para mim sim.', quality: 'awkward', feedback: 'Fraseado informal e incompleto — "pode me dar um mapa?" é o correto.', correction: 'Pode me dar um mapa, por favor?' },
      ],
    },
    {
      id: 'travel-pt-12',
      npc_message: 'Aproveite bem a cidade! Qualquer dúvida, estamos aqui.',
      npc_mood: 'happy',
      options: [
        { text: 'Muito obrigado! Tenho certeza que vou adorar.', quality: 'good', feedback: '"Tenho certeza que vou adorar" é entusiasmado e natural.' },
        { text: 'Obrigado. Tchau.', quality: 'ok', feedback: 'Correto — retribuir o entusiasmo é mais natural.', correction: 'Obrigado, vou aproveitar muito!' },
        { text: 'Sim obrigado eu vou muito gostar aqui.', quality: 'awkward', feedback: '"Vou gostar muito aqui" é a ordem mais natural.', correction: 'Obrigado, vou adorar a cidade!' },
      ],
    },
  ],
};

// ─── Business · Portuguese ────────────────────────────────────────────────────

const businessPt: ScenarioDialogue = {
  stageType: 'business',
  language: 'pt',
  sessionSize: 5,
  turns: [
    {
      id: 'business-pt-01',
      npc_message: 'Bom dia! Acredito que temos uma reunião marcada. Sou a Ana Souza.',
      npc_mood: 'neutral',
      options: [
        { text: 'Bom dia, Ana. Sou o Carlos — é um prazer.', quality: 'good', feedback: '"É um prazer" é o cumprimento profissional natural.' },
        { text: 'Olá. Sou Carlos.', quality: 'ok', feedback: 'Correto — "prazer em conhecê-la" completaria melhor.', correction: 'Olá, Ana. Sou Carlos — prazer em conhecê-la.' },
        { text: 'Sei que temos reunião. Carlos.', quality: 'awkward', feedback: 'Pouco caloroso para uma primeira reunião profissional.', correction: 'Bom dia, Ana. Prazer, Carlos.' },
      ],
    },
    {
      id: 'business-pt-02',
      npc_message: 'Posso oferecer um café ou água antes de começarmos?',
      npc_mood: 'happy',
      options: [
        { text: 'Um café seria ótimo, obrigado.', quality: 'good', feedback: 'Educado e natural.' },
        { text: 'Café, obrigado.', quality: 'ok', feedback: '"Um café seria ótimo" é mais natural do que apenas o substantivo.', correction: 'Café, por favor, obrigado.' },
        { text: 'Eu sempre tomo café então sim.', quality: 'awkward', feedback: 'Desnecessário explicar o hábito — uma aceitação simples basta.', correction: 'Um café, por favor. Obrigado.' },
      ],
    },
    {
      id: 'business-pt-03',
      npc_message: 'Então, poderia nos apresentar sua proposta?',
      npc_mood: 'neutral',
      options: [
        { text: 'Claro. Vou começar com um panorama geral dos pontos principais.', quality: 'good', feedback: '"Panorama geral" é vocabulário profissional adequado.' },
        { text: 'Sim, minha proposta é boa.', quality: 'ok', feedback: 'Vago — estruture a apresentação em vez de avaliá-la.', correction: 'Claro, vou apresentar os pontos principais.' },
        { text: 'Agora eu falo sobre a proposta que fiz.', quality: 'awkward', feedback: '"Vou apresentar minha proposta" é mais direto e profissional.', correction: 'Com certeza, vou apresentar a proposta.' },
      ],
    },
    {
      id: 'business-pt-04',
      npc_message: 'Interessante. Qual é o cronograma proposto?',
      npc_mood: 'neutral',
      options: [
        { text: 'Estimamos seis meses, com início no terceiro trimestre.', quality: 'good', feedback: '"Estimamos" e "terceiro trimestre" são vocabulário profissional natural.' },
        { text: 'Seis meses para tudo.', quality: 'ok', feedback: 'Claro mas vago — adicionar a data de início é mais profissional.', correction: 'Seis meses, começando no Q3.' },
        { text: 'O tempo é de seis meses talvez.', quality: 'awkward', feedback: '"Talvez" transmite insegurança — seja mais assertivo.', correction: 'Prevemos aproximadamente seis meses.' },
      ],
    },
    {
      id: 'business-pt-05',
      npc_message: 'Precisaríamos ver uma projeção de custos antes de qualquer comprometimento.',
      npc_mood: 'neutral',
      options: [
        { text: 'Com certeza — posso enviar até o final da semana.', quality: 'good', feedback: 'Comprometimento com prazo é profissional e concreto.' },
        { text: 'OK, mando os números depois.', quality: 'ok', feedback: '"Mando" é correto — especificar um prazo é ainda melhor.', correction: 'Claro, envio até sexta-feira.' },
        { text: 'Os custos não são problema grande.', quality: 'awkward', feedback: 'Minimizar a preocupação deles não é profissional — reconheça e ofereça a informação.', correction: 'Entendido — preparo um detalhamento e envio em breve.' },
      ],
    },
    {
      id: 'business-pt-06',
      npc_message: 'Tem alguma dúvida para nós neste momento?',
      npc_mood: 'neutral',
      options: [
        { text: 'Sim — como é o processo de decisão de vocês a partir daqui?', quality: 'good', feedback: 'Pergunta estratégica — mostra preparo e interesse genuíno.' },
        { text: 'Não tenho dúvidas.', quality: 'ok', feedback: 'Correto — fazer uma pergunta demonstra engajamento.', correction: 'Sim — quais são os próximos passos?' },
        { text: 'Quando vocês falam sim ou não?', quality: 'awkward', feedback: 'Tom direto demais — "Qual é o prazo para a decisão?" é mais profissional.', correction: 'Quando podemos esperar uma decisão?' },
      ],
    },
    {
      id: 'business-pt-07',
      npc_message: 'Temos algumas preocupações sobre a escalabilidade da solução.',
      npc_mood: 'neutral',
      options: [
        { text: 'É uma preocupação válida — deixe-me abordar isso diretamente.', quality: 'good', feedback: 'Reconhecer antes de responder é uma boa prática em reuniões.' },
        { text: 'OK, vou explicar a escalabilidade.', quality: 'ok', feedback: 'Correto — "deixe-me abordar isso" é mais fluido.', correction: 'Bom ponto — vou explicar como tratamos essa questão.' },
        { text: 'Escalabilidade não é problema, pode confiar.', quality: 'awkward', feedback: '"Pode confiar" sem evidência reduz a credibilidade.', correction: 'Entendo a preocupação — veja como a solução escala.' },
      ],
    },
    {
      id: 'business-pt-08',
      npc_message: 'Poderia compartilhar referências de projetos similares?',
      npc_mood: 'neutral',
      options: [
        { text: 'Claro — incluirei três estudos de caso no e-mail de acompanhamento.', quality: 'good', feedback: 'Específico e profissional — comprometer-se com estudos de caso é forte.' },
        { text: 'Sim, tenho referências. Mando.', quality: 'ok', feedback: '"Mando" é correto — um prazo tornaria melhor.', correction: 'Sim, envio referências relevantes em breve.' },
        { text: 'Tenho muitos clientes satisfeitos.', quality: 'awkward', feedback: 'Vago — forneça exemplos concretos.', correction: 'Claro, compartilho alguns casos relevantes.' },
      ],
    },
    {
      id: 'business-pt-09',
      npc_message: 'Acho que cobrimos os pontos principais. Podemos encerrar?',
      npc_mood: 'neutral',
      options: [
        { text: 'Sim — envio um resumo dos próximos passos ainda hoje.', quality: 'good', feedback: 'Tomar a iniciativa do follow-up é uma prática profissional excelente.' },
        { text: 'OK, reunião acabou.', quality: 'ok', feedback: '"A reunião pode ser encerrada" é mais formal.', correction: 'Sim, podemos encerrar. Envio um resumo depois.' },
        { text: 'Sim, falamos bastante hoje.', quality: 'awkward', feedback: 'Soa como se você estivesse cansado — encerre de forma positiva.', correction: 'Sim — obrigado pelo seu tempo.' },
      ],
    },
    {
      id: 'business-pt-10',
      npc_message: 'Obrigada pela visita. Entraremos em contato.',
      npc_mood: 'neutral',
      options: [
        { text: 'Obrigado, Ana. Fico no aguardo do retorno.', quality: 'good', feedback: '"Fico no aguardo do retorno" é o encerramento profissional natural.' },
        { text: 'OK. Tchau.', quality: 'ok', feedback: 'Correto mas abreviado — um "obrigado" aquece a despedida.', correction: 'Muito obrigado. Até mais.' },
        { text: 'Sim, me liga.', quality: 'awkward', feedback: 'Casual demais para um contexto profissional.', correction: 'Obrigado — aguardo o contato.' },
      ],
    },
    {
      id: 'business-pt-11',
      npc_message: 'Uma última coisa — você está disponível para uma call de acompanhamento na próxima terça?',
      npc_mood: 'neutral',
      options: [
        { text: 'Terça funciona — manhã ou tarde?', quality: 'good', feedback: 'Confirma disponibilidade e move a conversa adiante com precisão.' },
        { text: 'Sim, posso terça.', quality: 'ok', feedback: '"Estou disponível na terça" é mais natural.', correction: 'Sim, terça está ótimo.' },
        { text: 'Terça talvez pode ser bom.', quality: 'awkward', feedback: '"Talvez pode" é redundante — confirme diretamente.', correction: 'Terça está ótimo — qual horário?' },
      ],
    },
    {
      id: 'business-pt-12',
      npc_message: 'Enviaremos o convite pelo calendário. Boa viagem de volta.',
      npc_mood: 'happy',
      options: [
        { text: 'Obrigado — estarei de olho no convite. Tenha um ótimo dia!', quality: 'good', feedback: '"Estarei de olho" é natural e cálido.' },
        { text: 'OK. Até mais.', quality: 'ok', feedback: 'Correto — um pouco curto para uma despedida profissional.', correction: 'Obrigado, tenha um bom dia!' },
        { text: 'Bom. Manda para o meu e-mail.', quality: 'awkward', feedback: 'Parece uma ordem — eles já sabem onde enviar.', correction: 'Perfeito, obrigado! Até terça.' },
      ],
    },
  ],
};

// ─── Social · Portuguese ──────────────────────────────────────────────────────

const socialPt: ScenarioDialogue = {
  stageType: 'social',
  language: 'pt',
  sessionSize: 5,
  turns: [
    {
      id: 'social-pt-01',
      npc_message: 'Oi! Acho que a gente ainda não se conhece — sou a Lara.',
      npc_mood: 'happy',
      options: [
        { text: 'Oi, Lara! Sou o Gui — que bom te conhecer!', quality: 'good', feedback: 'Cálido e natural — espelhar a energia da pessoa é chave.' },
        { text: 'Olá. Sou Gui.', quality: 'ok', feedback: 'Correto mas um pouco formal para um contexto social.', correction: 'Oi, Lara! Sou Gui.' },
        { text: 'Nunca te vi antes. Gui.', quality: 'awkward', feedback: 'Tom estranho — "prazer, Gui!" é muito mais natural.', correction: 'Prazer! Sou o Gui.' },
      ],
    },
    {
      id: 'social-pt-02',
      npc_message: 'Como você conhece o anfitrião?',
      npc_mood: 'happy',
      options: [
        { text: 'A gente se conheceu na faculdade — e você?', quality: 'good', feedback: 'Resposta e contraperguntar flui naturalmente.' },
        { text: 'Faculdade. E você?', quality: 'ok', feedback: 'Direto — uma frase completa soaria mais envolvente.', correction: 'Nos conhecemos na faculdade. E você?' },
        { text: 'Da faculdade que eu estudava antes.', quality: 'awkward', feedback: '"A gente se conheceu na faculdade" é mais limpo.', correction: 'A gente se conheceu na faculdade.' },
      ],
    },
    {
      id: 'social-pt-03',
      npc_message: 'O que você faz da vida?',
      npc_mood: 'neutral',
      options: [
        { text: 'Trabalho com marketing — e você?', quality: 'good', feedback: '"Trabalho com" é a forma natural em PT-BR.' },
        { text: 'Sou de marketing.', quality: 'ok', feedback: '"Trabalho com marketing" é mais natural.', correction: 'Trabalho com marketing. E você?' },
        { text: 'Meu trabalho é sobre coisas de marketing.', quality: 'awkward', feedback: '"Coisas de marketing" é vago — diga a área diretamente.', correction: 'Trabalho com marketing.' },
      ],
    },
    {
      id: 'social-pt-04',
      npc_message: 'Legal! Sou fotógrafa freelance. Você tira muitas fotos?',
      npc_mood: 'happy',
      options: [
        { text: 'Só pelo celular — nada comparado a você!', quality: 'good', feedback: 'Humilde, relativo e conversa com naturalidade.' },
        { text: 'Sim, às vezes tiro fotos.', quality: 'ok', feedback: 'Correto mas vago — um detalhe mantém a conversa fluindo.', correction: 'Só casual, pelo celular mesmo.' },
        { text: 'Não sou profissional como você é.', quality: 'awkward', feedback: 'Correto mas a autodepreciação é um pouco abrupta.', correction: 'Só pelo celular mesmo — você deve ter câmera boa né?' },
      ],
    },
    {
      id: 'social-pt-05',
      npc_message: 'Você é daqui ou veio de longe?',
      npc_mood: 'neutral',
      options: [
        { text: 'Sou daqui mesmo — nasci e cresci aqui.', quality: 'good', feedback: '"Nasci e cresci" é uma expressão natural e fluente.' },
        { text: 'Sou daqui.', quality: 'ok', feedback: 'Correto — acrescentar um detalhe enriquece a conversa.', correction: 'Sou daqui, sim.' },
        { text: 'Eu moro aqui nessa cidade.', quality: 'awkward', feedback: '"Sou daqui" ou "moro aqui" são suficientes — não ambos.', correction: 'Sou daqui mesmo.' },
      ],
    },
    {
      id: 'social-pt-06',
      npc_message: 'Você já provou a comida aqui? Está incrível!',
      npc_mood: 'happy',
      options: [
        { text: 'Ainda não — o que você recomenda?', quality: 'good', feedback: 'Perguntar por recomendação abre mais conversa naturalmente.' },
        { text: 'Não, ainda não. O que tem de bom?', quality: 'ok', feedback: 'Natural — a variante "o que você recomenda?" é levemente mais envolvente.', correction: 'Ainda não — o que você recomenda?' },
        { text: 'Eu não comi as comidas daqui ainda.', quality: 'awkward', feedback: '"Ainda não experimentei" é mais natural do que "as comidas daqui."', correction: 'Ainda não — o que devo experimentar?' },
      ],
    },
    {
      id: 'social-pt-07',
      npc_message: 'Você precisa provar a bruschetta — é de outro mundo!',
      npc_mood: 'happy',
      options: [
        { text: 'Vendido! Vou pegar agora.', quality: 'good', feedback: '"Vendido!" é uma gíria natural e entusiasmada.' },
        { text: 'OK, vou experimentar.', quality: 'ok', feedback: 'Correto e natural — uma reação mais animada seria ainda melhor.', correction: 'Boa dica — já vou lá!' },
        { text: 'Sim eu vou comer bruschetta agora então.', quality: 'awkward', feedback: '"Então" no final soa truncado — reestruture a frase.', correction: 'Vou provar com certeza!' },
      ],
    },
    {
      id: 'social-pt-08',
      npc_message: 'Você fica até mais tarde?',
      npc_mood: 'neutral',
      options: [
        { text: 'Pretendo — não tenho compromisso amanhã cedo!', quality: 'good', feedback: '"Pretendo" é natural e a justificativa humaniza a resposta.' },
        { text: 'Sim, fico.', quality: 'ok', feedback: 'Correto — um detalhe deixa a resposta mais envolvente.', correction: 'Sim, pretendo ficar um bom tempo!' },
        { text: 'Talvez fico se não for tarde demais.', quality: 'awkward', feedback: '"Fico" precisa de "fique" no subjuntivo após "talvez."', correction: 'Talvez fique — depende da festa!' },
      ],
    },
    {
      id: 'social-pt-09',
      npc_message: 'A gente deveria trocar o número — conheço uns lugares ótimos para foto aqui.',
      npc_mood: 'happy',
      options: [
        { text: 'Com certeza! Me passa o seu.', quality: 'good', feedback: '"Com certeza" é entusiasta e natural.' },
        { text: 'Sim, boa ideia. Aqui está o meu número.', quality: 'ok', feedback: 'Correto e direto.', correction: 'Boa ideia! Aqui está o meu.' },
        { text: 'Ok você pode ter meu telefone.', quality: 'awkward', feedback: '"Ter o telefone" é incomum — "trocar o número" ou "passar o número" é natural.', correction: 'Claro! Aqui está o meu número.' },
      ],
    },
    {
      id: 'social-pt-10',
      npc_message: 'Foi ótimo conversar com você!',
      npc_mood: 'happy',
      options: [
        { text: 'Igualmente! A gente se encontra em breve.', quality: 'good', feedback: '"Igualmente" é um fechamento cálido e natural.' },
        { text: 'Sim, foi bom. Tchau.', quality: 'ok', feedback: 'Correto — "a gente se encontra" é mais caloroso.', correction: 'Igualmente — até mais!' },
        { text: 'Eu gostei dessa nossa conversa.', quality: 'awkward', feedback: 'Correto mas um pouco formal para o contexto social.', correction: 'Igualmente! Foi ótimo te conhecer.' },
      ],
    },
    {
      id: 'social-pt-11',
      npc_message: 'Tem ido a algum evento legal ultimamente?',
      npc_mood: 'happy',
      options: [
        { text: 'Sim! Fui a um show de música ao vivo semana passada — foi incrível.', quality: 'good', feedback: 'Específico e engajador — dá algo concreto para continuar a conversa.' },
        { text: 'Sim, alguns eventos. Foram bons.', quality: 'ok', feedback: 'Correto mas vago — um detalhe enriquece.', correction: 'Fui a um show semana passada — foi ótimo.' },
        { text: 'Fui a um evento de música recentemente passado.', quality: 'awkward', feedback: '"Recentemente passado" é redundante — "semana passada" ou "recentemente" bastam.', correction: 'Fui a um show semana passada!' },
      ],
    },
    {
      id: 'social-pt-12',
      npc_message: 'Você deveria vir no nosso passeio fotográfico no próximo domingo se estiver livre.',
      npc_mood: 'happy',
      options: [
        { text: 'Adoraria — conte comigo!', quality: 'good', feedback: '"Conte comigo" é entusiasta e muito natural.' },
        { text: 'OK, vou se estiver livre.', quality: 'ok', feedback: 'Correto — "adoraria ir" seria mais animado.', correction: 'Gostaria muito — vou verificar minha agenda.' },
        { text: 'Passeio de foto? O que é exatamente isso?', quality: 'awkward', feedback: 'Pedir esclarecimento é OK, mas o tom é um pouco frio.', correction: 'Um passeio fotográfico — que legal! Me conta mais.' },
      ],
    },
  ],
};

// ─── Survival · Portuguese ────────────────────────────────────────────────────

const survivalPt: ScenarioDialogue = {
  stageType: 'survival',
  language: 'pt',
  sessionSize: 5,
  turns: [
    {
      id: 'survival-pt-01',
      npc_message: 'Com licença — precisa de ajuda?',
      npc_mood: 'neutral',
      options: [
        { text: 'Sim, por favor — estou um pouco perdido.', quality: 'good', feedback: '"Estou um pouco perdido" é natural e não-alarmante.' },
        { text: 'Sim, estou perdido.', quality: 'ok', feedback: 'Claro e correto.', correction: 'Sim, pode me ajudar? Estou perdido.' },
        { text: 'Eu não sei onde estou indo agora.', quality: 'awkward', feedback: '"Estou perdido" é mais direto e natural.', correction: 'Sim, estou perdido — pode me ajudar?' },
      ],
    },
    {
      id: 'survival-pt-02',
      npc_message: 'Está bem? Parece que precisa de auxílio.',
      npc_mood: 'neutral',
      options: [
        { text: 'Estou bem, obrigado — preciso encontrar uma farmácia.', quality: 'good', feedback: 'Tranquilo e direto ao ponto.' },
        { text: 'Preciso de farmácia.', quality: 'ok', feedback: '"Estou procurando uma farmácia" é mais natural.', correction: 'Estou procurando uma farmácia.' },
        { text: 'Eu procuro uma loja de remédio.', quality: 'awkward', feedback: '"Farmácia" é o nome correto — "loja de remédio" não é padrão.', correction: 'Preciso encontrar uma farmácia, por favor.' },
      ],
    },
    {
      id: 'survival-pt-03',
      npc_message: 'O que está acontecendo?',
      npc_mood: 'neutral',
      options: [
        { text: 'Estou com uma dor de cabeça forte — tem algo para dor?', quality: 'good', feedback: '"Tem algo para dor?" é a forma natural de perguntar numa farmácia.' },
        { text: 'Tenho dor de cabeça. Me dá remédio.', quality: 'ok', feedback: '"Me dá" é direto demais — "poderia me recomendar algo?" é mais educado.', correction: 'Estou com dor de cabeça — pode me recomendar algo?' },
        { text: 'Minha cabeça está com dor muito forte dentro.', quality: 'awkward', feedback: '"Estou com uma dor de cabeça forte" é a forma natural.', correction: 'Estou com uma dor de cabeça forte.' },
      ],
    },
    {
      id: 'survival-pt-04',
      npc_message: 'Já tomou alguma coisa para isso?',
      npc_mood: 'neutral',
      options: [
        { text: 'Ainda não — por isso vim aqui.', quality: 'good', feedback: 'Natural e explica a situação claramente.' },
        { text: 'Não. Nada.', quality: 'ok', feedback: 'Claro — uma frase completa flui melhor.', correction: 'Ainda não.' },
        { text: 'Antes de vir aqui não tomei nenhum comprimido.', quality: 'awkward', feedback: 'Mais longo do que necessário — "ainda não" é suficiente.', correction: 'Ainda não, foi por isso que vim.' },
      ],
    },
    {
      id: 'survival-pt-05',
      npc_message: 'Recomendo o ibuprofeno — tem alguma alergia?',
      npc_mood: 'neutral',
      options: [
        { text: 'Não que eu saiba.', quality: 'good', feedback: '"Não que eu saiba" é natural e cobre a incerteza.' },
        { text: 'Não tenho alergia.', quality: 'ok', feedback: 'Correto e direto.', correction: 'Não, não tenho alergias conhecidas.' },
        { text: 'Eu não sei nada sobre as minhas alergias.', quality: 'awkward', feedback: 'Excessivamente longo — "não que eu saiba" é mais natural.', correction: 'Não que eu saiba.' },
      ],
    },
    {
      id: 'survival-pt-06',
      npc_message: 'São R$12,50. Como prefere pagar?',
      npc_mood: 'neutral',
      options: [
        { text: 'No cartão, por favor.', quality: 'good', feedback: 'Natural e direto.' },
        { text: 'Cartão.', quality: 'ok', feedback: '"No cartão" ou "no débito" são mais naturais.', correction: 'No cartão, obrigado.' },
        { text: 'Eu vou usar meu cartão de crédito para pagar.', quality: 'awkward', feedback: 'Muito longo — simplifique.', correction: 'No cartão, por favor.' },
      ],
    },
    {
      id: 'survival-pt-07',
      npc_message: 'Tome dois comprimidos com água, a cada quatro horas.',
      npc_mood: 'neutral',
      options: [
        { text: 'Entendido — dois comprimidos a cada quatro horas. Obrigado.', quality: 'good', feedback: 'Repetir as instruções mostra que entendeu — ótimo em contextos médicos.' },
        { text: 'OK. Entendi.', quality: 'ok', feedback: 'Correto — repetir a dose confirma o entendimento.', correction: 'OK, dois comprimidos a cada quatro horas.' },
        { text: 'Eu como dois comprimido com água?', quality: 'awkward', feedback: '"Tomar" não "comer" para medicamentos; e "comprimidos" (plural).', correction: 'Dois comprimidos a cada quatro horas, certo?' },
      ],
    },
    {
      id: 'survival-pt-08',
      npc_message: 'Se não melhorar, consulte um médico.',
      npc_mood: 'neutral',
      options: [
        { text: 'Certo — obrigado pelo conselho.', quality: 'good', feedback: 'Natural e grato.' },
        { text: 'OK. Vou ao médico se não melhorar.', quality: 'ok', feedback: 'Correto — confirmar o conselho é boa prática.', correction: 'Tudo bem, vou consultar um médico se necessário.' },
        { text: 'Médico aqui é caro.', quality: 'awkward', feedback: 'Fora do tópico — confirme o conselho em vez de comentar o preço.', correction: 'Entendido, obrigado pelo aviso.' },
      ],
    },
    {
      id: 'survival-pt-09',
      npc_message: 'Precisa de mais alguma coisa?',
      npc_mood: 'neutral',
      options: [
        { text: 'Não, acho que é isso — muito obrigado!', quality: 'good', feedback: '"Acho que é isso" é natural e encerrativo.' },
        { text: 'Não, tudo bem. Obrigado.', quality: 'ok', feedback: 'Correto e educado.', correction: 'Não, obrigado — é só isso mesmo.' },
        { text: 'Não quero mais coisas. Tchau.', quality: 'awkward', feedback: '"Não quero mais coisas" é incomum — "é só isso, obrigado" é natural.', correction: 'Não, é só isso. Obrigado.' },
      ],
    },
    {
      id: 'survival-pt-10',
      npc_message: 'Melhoras!',
      npc_mood: 'happy',
      options: [
        { text: 'Muito obrigado — tenho certeza que vou melhorar!', quality: 'good', feedback: 'Caloroso e natural — reconhece o desejo deles.' },
        { text: 'Obrigado. Tchau.', quality: 'ok', feedback: 'Correto — retribuir o desejo é mais caloroso.', correction: 'Obrigado, até mais!' },
        { text: 'Sim eu também espero que eu melhoro.', quality: 'awkward', feedback: '"Eu melhoro" está errado — "eu melhore" (subjuntivo) ou simplesmente "obrigado."', correction: 'Obrigado! Espero que sim.' },
      ],
    },
    {
      id: 'survival-pt-11',
      npc_message: 'Com licença, poderia me dizer onde fica o supermercado mais próximo?',
      npc_mood: 'neutral',
      options: [
        { text: 'Claro — tem um logo ali na esquina.', quality: 'good', feedback: '"Logo ali na esquina" é uma localização natural e visual.' },
        { text: 'Supermercado é perto aqui.', quality: 'ok', feedback: '"Tem um perto daqui" é mais natural.', correction: 'Tem um perto daqui — siga em frente.' },
        { text: 'Não sei. Talvez por lá.', quality: 'awkward', feedback: 'Se não tiver certeza, "não tenho certeza, desculpe" é mais natural.', correction: 'Não tenho certeza, desculpe.' },
      ],
    },
    {
      id: 'survival-pt-12',
      npc_message: 'Alguém aqui fala português? Preciso de ajuda com meu celular.',
      npc_mood: 'neutral',
      options: [
        { text: 'Eu falo — qual é o problema? Talvez eu possa ajudar.', quality: 'good', feedback: '"Talvez eu possa ajudar" é natural e acolhedor.' },
        { text: 'Sim. Que problema você tem?', quality: 'ok', feedback: '"Qual é o problema?" é mais natural do que "que problema você tem?"', correction: 'Sim, falo — qual é o problema?' },
        { text: 'Eu falo português também. Celular problema?', quality: 'awkward', feedback: 'Telegráfico — forme uma pergunta completa.', correction: 'Falo sim — o que aconteceu com o celular?' },
      ],
    },
  ],
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const scenarioDialogues: ScenarioDialogue[] = [
  cafeEs, travelEs, businessEs, socialEs, survivalEs,
  cafeFr, travelFr, socialFr, businessFr, survivalFr,
  cafeDe, travelDe, businessDe, socialDe, survivalDe,
  cafeIt, travelIt, businessIt, socialIt, survivalIt,
  cafeEn, travelEn, businessEn, socialEn, survivalEn,
  cafePt, travelPt, businessPt, socialPt, survivalPt,
];

export function getSessionTurns(
  stageType: string,
  language: string,
  sessionIndex: number = 0,
): StaticTurn[] | null {
  const dialogue =
    scenarioDialogues.find(d => d.stageType === stageType && d.language === language) ??
    scenarioDialogues.find(d => d.stageType === stageType && d.language === 'es');
  if (!dialogue) return null;

  const pool = dialogue.turns;
  const size = dialogue.sessionSize;
  const offset = (sessionIndex * size) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  return rotated.slice(0, size);
}
