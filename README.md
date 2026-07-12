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
