# Kanè Tile Studio — GitHub Pages + Supabase

Configuratore 3D di mattonelle con rilievo da immagine e raccolta richieste.

## Dati raccolti

Come dato personale viene richiesto soltanto l’indirizzo email. Il sistema salva inoltre:

- quantità;
- configurazione tecnica della mattonella;
- file grafico necessario alla lavorazione;
- codice e stato della richiesta.

Non sono presenti analytics, telefono, nome o indirizzo.

## 1. Configurare Supabase

1. Apri il progetto Supabase.
2. Vai in **SQL Editor**.
3. Incolla ed esegui tutto il contenuto di `supabase/setup.sql`.
4. Vai in **Project Settings → API**.
5. Copia il **Project URL**.
6. Copia la **Publishable key** oppure la vecchia **anon key**.
7. Apri `config.js` e sostituisci i due valori segnaposto.

Non inserire mai una `service_role` o una secret key nel repository.

## 2. Pubblicare su GitHub Pages

1. Crea un repository pubblico.
2. Carica nella root tutti i file e le cartelle del progetto.
3. Vai in **Settings → Pages**.
4. In **Build and deployment**, scegli **Deploy from a branch**.
5. Seleziona `main` e `/(root)`.
6. Salva.

Il sito sarà disponibile all’indirizzo:

`https://NOMEUTENTE.github.io/NOMEREPOSITORY/`

## 3. Visualizzare gli ordini

Nel pannello Supabase:

- **Table Editor → orders** per vedere le richieste;
- **Storage → order-files** per vedere i file caricati.

I file sono privati. Dal pannello Supabase puoi comunque consultarli come amministratore.

## Sicurezza impostata

- RLS attiva sulla tabella ordini;
- visitatori autorizzati soltanto all’inserimento;
- nessuna lettura, modifica o cancellazione pubblica;
- bucket privato;
- file limitati a PNG, JPG e WEBP;
- dimensione massima 8 MB;
- campo antispam invisibile;
- validazione email e quantità sia nel browser sia nel database.

## Limite importante

Un sito pubblico senza autenticazione può comunque ricevere spam o caricamenti automatici.
Per una pubblicazione commerciale è consigliato aggiungere successivamente:

- Cloudflare Turnstile;
- rate limiting tramite Edge Function;
- notifica email lato server;
- cancellazione automatica delle richieste scadute.

## File principali

- `index.html` — interfaccia;
- `style.css` — grafica;
- `app.js` — configuratore e invio ordine;
- `config.js` — credenziali pubblicabili Supabase;
- `supabase/setup.sql` — database, bucket e policy.


## Aggiornamento interfaccia v2

- selezione dello smalto tramite menu a tendina;
- modulo email e quantità sempre visibile;
- pulsante `Proponi ordine`;
- immagine del rilievo centrata e contenuta senza deformazioni;
- anteprima 3D fissa durante lo scorrimento sui telefoni;
- salvataggio dello smalto scelto nella configurazione Supabase.


## Aggiornamento v4

- nessun piano di sfondo;
- nessuna ombra;
- solo mattonella nella scena;
- materiale ceramico fisico;
- colore uniforme su base e rilievo;
- rimossa la cornice;
- sezione “Rilievo mattonella” evidenziata;
- il form salva su Supabase e non invia ancora email automatiche.




## Aggiornamento v8

- rimossa completamente l’Area riservata;
- rimosso il bollino con il numero degli ordini;
- rimossa la password amministrativa;
- rimossa la Edge Function `admin-orders`;
- gli ordini continuano a essere salvati nella tabella Supabase `orders`.


## Aggiornamento v9 — rilievo e ceramica ad alta qualità

- elaborazione delle immagini fino a 1024 px su desktop e 768 px su mobile;
- mesh adattiva fino a circa 420 segmenti sul lato lungo;
- campionamento bilineare;
- filtro gaussiano anti-pixel;
- normali geometriche ricalcolate;
- riflessi ambientali generati localmente con `RoomEnvironment`;
- materiale `MeshPhysicalMaterial`;
- clearcoat differenziato per smalti lucidi e opachi;
- micro-normal map procedurale per simulare piccole irregolarità ceramiche;
- file immagine consentiti fino a 16 MB.

Su telefoni meno potenti, l’elaborazione di immagini molto complesse può richiedere
alcuni secondi. La risoluzione viene automaticamente bilanciata per non bloccare il browser.


## Aggiornamento v10

- inquadratura automatica centrata con calcolo del bounding box;
- cornice standard fissa;
- testo centrale realmente estruso in 3D;
- quattro font selezionabili;
- dimensione del testo regolabile;
- adattamento automatico del testo all’area disponibile;
- elaborazione immagine fino a 1536 px su desktop e 1024 px su mobile;
- mesh rilievo fino a circa 680 segmenti sul lato lungo;
- qualità ancora superiore, con maggiore carico su dispositivi meno potenti.


## Aggiornamento v11

- selezione obbligatoria e mutuamente esclusiva:
  - Scritta su mattonella;
  - Immagine in rilievo.
- la scritta viene visualizzata in tempo reale durante la digitazione;
- rendering del testo tramite texture canvas ad alta definizione;
- scelta tra scritta in rilievo e scritta incisa;
- profondità della scritta regolabile;
- le sezioni non pertinenti vengono nascoste automaticamente;
- l’ordine Supabase salva il tipo di servizio scelto.

## Aggiornamento v12
- schede ordinate Scritta / Immagine;
- testo corretto con displacement reale;
- 13 cornici;
- smalto marrone lucido, clearcoat e cavillature;
- rilievi fino a 2048 px e mesh fino a 820 segmenti.


## Aggiornamento v13

- corretto il problema della mattonella 3D non visibile;
- inquadratura semplificata e più robusta;
- sfondo Three.js trasparente;
- rimosso il controllo dello spessore;
- spessore fisso impostato a 8 mm;
- salvataggio ordine aggiornato con spessore fisso.


## Aggiornamento v14 — correzione definitiva scena 3D

- corretto un errore runtime nella funzione della cornice;
- `baseTop` viene ora passato correttamente alla geometria;
- la base della mattonella viene renderizzata anche se una cornice fallisce;
- inquadratura con margine maggiore;
- distanza minima della fotocamera per evitare zoom eccessivo;
- mattonella centrata e visibile su iPhone e desktop.

## Aggiornamento v15
- pulsante Applica scritta;
- scritta calcolata solo su comando;
- testo più evidente e centrato;
- zoom manuale più vicino;
- inquadratura iniziale meno ravvicinata su desktop.


## Aggiornamento v16 — scritta con geometria 3D reale

- eliminata la scritta simulata tramite displacement map;
- introdotta `TextGeometry` con lettere realmente estruse;
- caricamento del font al click su `Applica scritta`;
- centratura automatica della geometria;
- adattamento automatico alle dimensioni della mattonella;
- effetto inciso reso tramite posizionamento parziale nella superficie;
- maggiore compatibilità con Safari e iPhone.


## Aggiornamento v17 — materiale scritta corretto

- corrette le facce bianche della scritta;
- rimosse normal map, roughness map e bump map dalla TextGeometry;
- materiale ceramico dedicato per le lettere;
- normali della geometria ricalcolate;
- scritta posizionata più chiaramente sopra la superficie;
- dimensione e profondità aggiornate numericamente in tempo reale;
- aggiornamento diretto anche per rilievo immagine e contrasto.


## Aggiornamento v18 — font locali

- rimossi FontLoader e TextGeometry;
- nessun file font esterno da scaricare;
- font generati tramite Canvas usando quelli di sistema;
- compatibilità maggiore con Safari e GitHub Pages;
- scritta applicata immediatamente;
- alpha map e bump map dedicate per rendere leggibili le lettere;
- nessun errore di connessione durante `Applica scritta`.


## Aggiornamento v19 — scritta ritagliata e dimensione reale

- rimosso l’effetto rettangolo/plane visibile;
- canvas con sfondo realmente trasparente;
- alpha map e alpha test ritagliano soltanto le lettere;
- dimensione testo collegata alla geometria;
- il cursore modifica realmente altezza e larghezza della scritta;
- valore numerico aggiornato immediatamente;
- profondità aggiornata immediatamente;
- rilievo positivo e negativo mantenuti.


## Aggiornamento v20 — scritta come modello 3D separato

- la scritta non viene più “stampata” sulla superficie della mattonella;
- il testo viene rasterizzato e convertito in un vero modello 3D separato;
- il modello è composto da volumi 3D indipendenti, poi appoggiati alla mattonella;
- la dimensione del cursore agisce direttamente sul modello 3D;
- per la modalità incisa:
  - viene creato un volume del testo ribassato;
  - sopra viene aggiunta una maschera che simula l’apertura del materiale;
  - l’effetto finale è più vicino a un boolean in tempo reale.


## Aggiornamento v21

- aggiunto font Corsivo;
- selettore font personalizzato;
- ogni voce viene mostrata nello stile del font rappresentato;
- rimossa la normale tendina di sistema;
- corretta la modalità incisa;
- la scritta negativa usa due volumi 3D:
  - volume ribassato;
  - bordo interno scuro;
- eliminata la maschera che nascondeva la scritta incisa.


## Aggiornamento v22

- risoluzione del modello testo aumentata sensibilmente;
- campionamento alpha più preciso e meno dentellato;
- supporto testo multilinea fino a quattro righe;
- campo testo trasformato in textarea;
- allineamento per riga: sinistra, centro o destra;
- modalità negativa resa sempre visibile con fondo inciso e bordo interno;
- allineamento salvato nella configurazione dell'ordine.


## Aggiornamento v23

- risoluzione del testo aumentata ancora:
  - raster 4096×2048;
  - voxelizzazione molto più densa;
  - bordi meno dentellati;
- modalità negativa riprogettata con effetto tipo boolean:
  - fondo cavità;
  - parete interna;
  - piano di copertura con foro del testo;
- la camera non si resetta più quando cambi parametri;
- l’inquadratura viene calcolata solo all’avvio e quando premi “reset view”;
- il resize del pannello non forza più il riframing automatico.


## Aggiornamento v24

- eliminato il riframing automatico dentro `rebuildTile()`;
- la camera non torna più al punto iniziale quando modifichi i parametri;
- il reset vista avviene solo col pulsante dedicato;
- intestazione aggiornata a `Kanè Tile Studio v24`.


## Aggiornamento v25

- versione visibile aggiornata a `Kanè Tile Studio v25`;
- colore iniziale della prima mattonella impostato su `Sabbia`;
- rimossa la modalità scritta incisa;
- rimossa la possibilità di allineare il testo;
- il testo resta centrato automaticamente;
- confermata la rimozione del reset automatico camera quando cambi parametri.


## Aggiornamento v26

- versione aggiornata a `Kanè Tile Studio v26`;
- aggiunto pulsante rotondo fisso in basso a destra;
- testo pulsante: `Home Kanè Store`;
- aggiunta freccia per il ritorno;
- collegamento a `https://www.disegno4d.it/e-commerce/`;
- adattamento dimensioni per desktop e mobile.


## Aggiornamento v28 — link pubblico del progetto

Ogni nuovo ordine salva:

- `project_token`;
- `project_url`;
- `public_asset_path`.

Il link riapre la configurazione tecnica della mattonella senza esporre
email, quantità o stato dell'ordine.

Prima di usare la nuova versione, esegui nel SQL Editor di Supabase:

`supabase/migration_v28_project_links.sql`


## Aggiornamento v29

- inquadratura iniziale desktop spostata verso il centro verticale;
- nessuna modifica all'inquadratura mobile;
- doppio `requestAnimationFrame` all'avvio per attendere il layout definitivo;
- versione aggiornata a `Kanè Tile Studio v29`.


## Aggiornamento v30

- su PC la mattonella viene spostata direttamente verso l’alto;
- nessuna modifica alla camera;
- nessuna modifica alla versione mobile;
- offset desktop fisso: `tileGroup.position.y = 0.34`;
- versione aggiornata a `Kanè Tile Studio v30`.


## Aggiornamento v31

- corretto il vero problema della centratura desktop;
- il viewer non assume più l'altezza dell'intera colonna dei comandi;
- il viewer occupa l'altezza disponibile dello schermo;
- la colonna destra scorre separatamente;
- rimossi gli spostamenti artificiali della mattonella;
- versione mobile lasciata invariata;
- versione aggiornata a `Kanè Tile Studio v31`.
