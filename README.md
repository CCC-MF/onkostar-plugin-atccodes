# Onkostar Plugin ATC-Codes und Substanzen

Dieses Onkostar-Plugin ermöglicht das Abfragen von ATC-Codes und Substanzen aus Dateien und der Datenbank.

## Voraussetzungen

Im Onkostarverzeichnis sollte eine Datei `atc.xml` oder eine Datei `atc.csv` vorhanden sein.

Der Ort zur Ablage dieser Dateien unterscheidet sich nach verwendetem Betriebssystem:

* **Windows**: `C:\onkostar\files\onkostar\plugins\onkostar-plugin-atccodes\`
* **Linux**: `/opt/onkostar/files/onkostar/plugins/onkostar-plugin-atccodes/`

## Funktionalität

Das Plugin liest vorhandene Dateien `atc.xml` oder `atc.csv` ein und ermöglicht zusammen mit Inhalten
vom `OS.Substanzen` das Abfragen von Substanzen und deren Code.

Substanzen aus der Onkostar-Datenbank werden mit internem Code übergeben.
Substanzen aus einer WHO-XML-Datei (siehe hier: https://www.whocc.no/atc_ddd_index_and_guidelines/order/)
oder einer selbst zusammen gestellten CSV-Datei werden mit ATC-Code übergeben.

Zusätzlich erfolgt die Übergabe des verwendeten Systems gemäß bwHC-Datenmodell 1.0.

* `UNREGISTERED`: Substanz ist in `OS.Substanz` vorhanden und es wird davon auszugehen, dass kein ATC-Code verwendet
  wird.
* `ATC`: Substanz stammt aus WHO-XML-Datei oder einer selbst erstellten CSV-Datei, welche ATC-Codes bereitstellt.

Antworten sind wie folgt strukturiert

* `code`: Der ATC-Code (wenn System "ATC") oder das interne Kürzel in Onkostar
* `name`: Der Name der Substanz
* `system`: Das verwendete System. `ATC` oder `UNREGISTERED` entsprechend bwHC-Datenmodell 1.0

Übergeben werden Substanzen, deren **Name** oder **Code** mit der Zeichenkette in Inputparameter `q` beginnt.
Die Ergebnisse sind auf `size` Einträge je Datenquelle limitiert.

Die Antwort für nachfolgendes Beispiel zur Verwendung in einem Formularscript enthält Substanzen, die mit `Acetylsal` beginnen.

```json
[
  {
    "code": "A01AD05",
    "name": "Acetylsalicylic acid",
    "system": "ATC"
  },
  {
    "code": "B01AC06",
    "name": "Acetylsalicylic acid",
    "system": "ATC"
  },
  {
    "code": "M01BA03",
    "name": "Acetylsalicylic acid and corticosteroids",
    "system": "ATC"
  },
  {
    "code": "Acetylsali",
    "name": "Acetylsalicylsäure",
    "system": "UNREGISTERED"
  }
]
```

### Beispiel zur Verwendung in einem Formularscript

Folgendes Script kann zur Abfrage von Substanzen und ATC-Codes in einem Script verwendet werden.

```javascript
// Hier mit Wert "Acetylsal"
var query = getFieldValue('q');

var onFailure = function () {
    Ext.MessageBox.show({
        title: 'Hinweis',
        msg: 'Plugin "ATC-Codes und Substanzen" nicht verfügbar. Nutzen Sie das Freitextfeld',
        buttons: Ext.MessageBox.OKCANCEL,
        fn: function (btn) {
            // Noop
        }
    });
};

var addItem = function (item) {
    // Do something useful ...
    console.log(item);
}

var onSuccess = function (data) {
    const extData = data.map((item) => [item.code, item.name, item.system]);

    const store = new Ext.data.ArrayStore({
        fields: [
            {name: 'code'},
            {name: 'name'},
            {name: 'system'}
        ]
    });
    store.loadData(extData);

    var selectedItemIndex = -1;

    const grid = new Ext.grid.GridPanel({
        store: store,
        loadMask: true,
        border: false,
        columns: [
            {header: 'Code', width: 80, sortable: false, dataIndex: 'code'},
            {header: 'Name', width: 400, sortable: false, dataIndex: 'name'},
            {header: 'System', width: 80, sortable: false, dataIndex: 'system'},
        ],
        viewConfig: {forceFit: true},
        listeners: {
            itemclick: (dv, record, item, index, e) => {
                selectedItemIndex = index;
            },
            itemdbclick: (dv, record, item, index, e) => {
                selectedItemIndex = index;
            }
        }
    });

    Ext.create('Ext.window.Window', {
        title: 'Substanz auswählen',
        height: 400,
        width: 600,
        layout: 'fit',
        items: [grid],
        buttons: [{
            text: 'Hinzufügen',
            cls: 'onko-btn-cta',
            handler: () => {
                if (selectedItemIndex > 0) {
                    addItem(data[selectedItemIndex]);
                    var win = Ext.WindowManager.getActive();
                    if (win) {
                        win.close();
                    }
                }
            }
        }, {
            text: 'Abbrechen',
            handler: () => {
                var win = Ext.WindowManager.getActive();
                if (win) {
                    win.close();
                }
            }
        }]
    }).show();
};

executePluginMethod(
    'AtcCodesPlugin',
    'query',
    {q: query, size: 10},
    function (response) {
        if (response.status.code < 0) {
            onFailure();
            return;
        }
        onSuccess(response.result);
    },
    false
);
```

## Build

Voraussetzung ist das Kopieren der Datei `onkostar-api-2.11.1.1.jar` (oder neuer) in das Projektverzeichnis `libs`.

**_Hinweis_**: Bei Verwendung einer neueren Version der Onkostar-API muss die Datei `pom.xml` entsprechend angepasst
werden.

Danach Ausführen des Befehls:

```shell
./mvnw package
```
