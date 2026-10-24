UsefulAddons – icônes & bannières (v1, 23 oct. 2026)

Dossiers icons/<id>/ :
  <id>.png            128 x 128  icône store + logoUrl du manifest
  <id>-32.png         32 x 32    barre d'outils (redessinée, pas réduite)
  <id>-48.png, -64.png           variantes compactes
  <id>-96.png, -256.png, -512.png, -1024.png   masters haute résolution
  <id>-oauth-120.png  120 x 120  écran de consentement OAuth (upload console GCP)
  <id>-banner.png     220 x 140  tuile du Marketplace
  <id>-banner@2x.png  440 x 280  même tuile, retina

svg/ : sources vectorielles (grand format et variante 32 px)

Correspondance avec le repo public 3ls3/weathercalendar (branche main) :
  usefuladdons         -> usefuladdons.png (nouveau, marque ombrelle)
  weathercalendar-new  -> NE PAS écraser weathercalendar.png (logo live, 1500 utilisateurs) sans décision explicite
  weathercalendarpro   -> weathercalendarpro.png
  weathercalendarultra -> weathercalendarultra.png
  pollencalendar       -> pollencalendar.png (remplace le 92 x 95, supprimer pollencalendar-128.png)
  horoscopecalendar    -> horoscopecalendar.png
  horoscopeprocalendar -> horoscopeprocalendar.png
  plannercalendar      -> plannercalendar.png

Régénérer : node build.js (Playwright + Chromium), puis python3 make_board.py pour la page de marque.
