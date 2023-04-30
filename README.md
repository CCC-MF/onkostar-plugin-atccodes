# Onkostar Plugin ATC-Codes und Substanzen

Dieses Onkostar-Plugin ermöglicht das Abfragen von ATC-Codes und Substanzen aus Dateien und der Datenbank.

## Voraussetzungen

Im Onkostarverzeichnis sollte eine Datei `atc.xml` oder eine Datei `atc.csv` vorhanden sein.

Der Ort zur Ablage dieser Dateien unterscheidet sich nach verwendetem Betriebssystem:

* **Windows**: `C:\onkostar\files\onkostar\plugins\onkostar-plugin-atccodes\`
* **Linux**: `/opt/onkostar/files/onkostar/plugins/onkostar-plugin-atccodes/`

### Unterstütztes Format der selbst erstellten CSV-Datei

Die CSV-Datei muss die beiden Spalten `CODE` und `NAME` mit den entsprechenden Informationen enthalten. Die Spalte `VERSION` ist optional. 
Beim Import wird die erste Zeile der Datei, welche die Spaltenüberschriften enthält, nicht verarbeitet.
Entsprechend [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180) werden Werte durch Kommata getrennt und von `"`
umschlossen,
wenn Sie Leerzeichen enthalten.

## Funktionalität

Das Plugin liest vorhandene Dateien `atc.xml` oder `atc.csv` ein und ermöglicht zusammen mit Inhalten
vom `OS.Substanzen` das Abfragen von Substanzen und deren Code.

Substanzen aus der Onkostar-Datenbank werden mit internem Code übergeben.
Substanzen aus einer WHO-XML-Datei (siehe hier: https://www.whocc.no/atc_ddd_index_and_guidelines/order/)
oder einer selbst zusammen gestellten CSV-Datei werden mit ATC-Code übergeben.

Zusätzlich erfolgt die Übergabe des verwendeten Systems gemäß bwHC-Datenmodell 1.0.

* `UNREGISTERED`: Substanz ist in `OS.Substanz` vorhanden und es wird davon auszugehen, dass kein ATC-Code verwendet
  wird. Entspricht der Code dem Muster eines ATC-Codes, wird die Substanz als ATC-Code verwendet.
* `ATC`: Substanz stammt aus WHO-XML-Datei oder einer selbst erstellten CSV-Datei, welche ATC-Codes bereitstellt.

Antworten sind wie folgt strukturiert

* `code`: Der ATC-Code (wenn System "ATC") oder das interne Kürzel in Onkostar
* `name`: Der Name der Substanz
* `system`: Das verwendete System. `ATC` oder `UNREGISTERED` entsprechend bwHC-Datenmodell 1.0
* `version`: Die Version des Codes, wenn in CSV-Datei eingetragen, entsprechend bwHC-Datenmodell 1.0

Übergeben werden Substanzen, deren **Code** mit der Zeichenkette in Inputparameter `q` beginnt oder deren **Name** die
Zeichenkette in Inputparameter `q` enthält.

Die Ergebnisse sind auf `size` Einträge je Datenquelle limitiert.

Die Antwort für nachfolgendes Beispiel zur Verwendung in einem Formularscript enthält Substanzen, die mit `Acetylsal`
beginnen. Die Angabe der Version ist dabei abhängig davon, ob Informationen darüber vorliegen.

```json
[
  {
    "code": "A01AD05",
    "name": "Acetylsalicylic acid",
    "system": "ATC",
    "version": "2023"
  },
  {
    "code": "B01AC06",
    "name": "Acetylsalicylic acid",
    "system": "ATC",
    "version": "2023"
  },
  {
    "code": "M01BA03",
    "name": "Acetylsalicylic acid and corticosteroids",
    "system": "ATC",
    "version": "2023"
  },
  {
    "code": "Acetylsali",
    "name": "Acetylsalicylsäure",
    "system": "UNREGISTERED"
  }
]
```

### Beispiel zur Verwendung in einem Formularscript

Der Auswahldialog kann auf zwei verschiedene Arten angezeigt werden.

#### Kopieren des Beispielscripts

Das Script in [`examples/dialog.js`](examples/dialog.js) zeigt ein Beispiel zur Verwendung in einem Formularscript.
Das Beispiel geht davon aus, dass es in einem Formular die beiden Textfelder (Memo) `wirkstoffe` und `wirkstoffejson`
gibt.

#### Einbinden der enthaltenen JavaScript-Ressource

Dieses Plugin enthält eine Web-Ressource, welche den Code des verwendeten Dialogs enthält. Das folgende kurze Script
kann dazu verwendet werden, den entsprechenden JavaScript-Code abzurufen und benötigte Funktionen aufzurufen.

```javascript
Ext.syncRequire('app.plugins.atccodes.AtcCodesDialog', () => {
    let AtcCodesDialog = Ext.ClassManager.get('AtcCodesDialog');
    if (AtcCodesDialog === null) {
        Ext.MessageBox.show({
            title: 'Hinweis',
            msg: 'Plugin "ATC-Codes und Substanzen" nicht verfügbar.',
            buttons: Ext.MessageBox.OK
        });
        return;
    }
    AtcCodesDialog.show(this);
});
```

Dabei wird zunächst das entsprechende Script geladen, wenn es nicht bereits zuvor geladen wurde.

Ist das Plugin nicht installiert und daher auch die entsprechende JavaScript-Klasse nicht verfügbar,
wird ein entsprechender Hinweis ausgegeben.

Andernfalls wird die Funktion `show()` aufgerufen, welche `this` als Parameter erfordert um den Kontext des Aufrufs zu
kennen.
Die beiden folgenden Parameter sind optional und geben die zu nutzenden Formularfeldnamen an.
Werden keine Formularfeldnamen angegeben, wird davon ausgegangen, dass es in einem Formular die beiden
Textfelder (Memo) `wirkstoffe` und `wirkstoffejson` gibt.

Im Feld `wirkstoffe` werden die Namen der Substanzen zeilenweise aufgelistet, im Feld `wirkstoffejson` die
entsprechenden Daten der ausgewählten Wirkstoffe als JSON-String hinterlegt. Beim Öffnen des Dialogs werden die Daten
aus dem Feld `wirkstoffejson` ausgelesen und, sofern es dabei keinen Fehler gab, für den Dialog verwendet.

## Enthaltene Wirkstoffliste

Die Datei [`examples/atc.csv`](examples/atc.csv) enthält die Wirkstoffe
aus https://confluence.it-choice.de/display/DNPM/Wirkstofflisten.

## Build

Für das Bauen des Plugins ist zwingend JDK in Version 11 erforderlich.
Spätere Versionen des JDK beinhalten einige Methoden nicht mehr, die von Onkostar und dort benutzten Libraries verwendet
werden.

Voraussetzung ist das Kopieren der Datei `onkostar-api-2.11.1.5.jar` (oder neuer) in das Projektverzeichnis `libs`.

**_Hinweis_**: Bei Verwendung einer neueren Version der Onkostar-API muss die Datei `pom.xml` entsprechend angepasst
werden.

Danach Ausführen des Befehls:

```shell
./mvnw package
```