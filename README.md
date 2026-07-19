# BlenkBase Catalog

Offizieller Spiele- und Definitionskatalog für **BlenkBase – Command your world.**

Dieses Repository liefert datengetriebene Spieldefinitionen und den automatisch
erzeugten `feed.json` aus. BlenkBase kann damit neue Spiele und aktualisierte
Serverprofile installieren, ohne dass für jede Katalogänderung ein neuer
Programm-Installer gebaut werden muss.

## Verwendung in BlenkBase

Als Katalog-Feed wird folgende Adresse verwendet:

```text
https://raw.githubusercontent.com/unique1986/BlenkBase-Catalog/main/feed.json
```

Jede Definition wird vor der Installation validiert und über die im Feed
gespeicherte SHA-256-Prüfsumme geprüft. Installationen und Updates werden im
Webinterface weiterhin bewusst durch einen Administrator ausgelöst.

## Definitionen erweitern

Eine Definition ist eine JSON-Datei im Hauptverzeichnis. Nach einer Änderung
erzeugt die GitHub-Aktion den Feed und alle Prüfsummen neu. Neue Definitionen
sollen zunächst den Reifegrad `experimental` erhalten und erst nach einem echten
Installations-, Start-, Stop-, Port-, Konfigurations- und Backuptest freigegeben
werden.
