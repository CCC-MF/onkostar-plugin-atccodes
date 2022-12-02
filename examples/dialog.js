const requestedStore = new Ext.data.ArrayStore({
    fields: [
        { name: 'code' },
        { name: 'name' },
        { name: 'system' }
    ]
});

const selectedStore = new Ext.data.ArrayStore({
    fields: [
        { name: 'code' },
        { name: 'name' },
        { name: 'system' }
    ]
});

var pluginRequestsDisabled = false;
var requested = [];
var selected = [];

var request = function(q) {
    if (pluginRequestsDisabled) return;
    executePluginMethod(
        'AtcCodesPlugin',
        'query',
        { q: q, size: 25 },
        function (response) {
            if (response.status.code < 0) {
                onFailure();
                return;
            }
            onSuccess(response.result);
        },
        false
    );
}

var addItem = function(item) {
    selected.push(item);
    const extData = selected.map((item) => [item.code, item.name, item.system]);
    selectedStore.loadData(extData);
}

var removeItem = function(index) {
    selected.splice(index, 1);
    const extData = selected.map((item) => [item.code, item.name, item.system]);
    selectedStore.loadData(extData);
}

var save = function() {
    var names = selected.map((item) => {return item.name;}).join("\n");
    setFieldValue('wirkstoffe', names);
    setFieldValue('wirkstoffejson', JSON.stringify(selected));
}

var onFailure = function() {
    pluginRequestsDisabled = true;
    Ext.MessageBox.show({
        title: 'Hinweis',
        msg: 'Plugin "ATC-Codes und Substanzen" nicht verfügbar. Sie können Substanzen nur über "Aus Suchfeld hinzufügen" hinzufügen.',
        buttons: Ext.MessageBox.OKCANCEL,
        fn: function (btn) {
        // Noop
        }
    });
};

var onSuccess = function(d) {
    requested = d;
    const extData = requested.map((item) => [item.code, item.name, item.system]);
    requestedStore.loadData(extData);
}

var showDialog = function() {
    var selectedItemIndex = -1;
    var deselectedItemIndex = -1;
    var queryString = '';

    try {
        selected = JSON.parse(getFieldValue('wirkstoffejson'));
        const extData = selected.map((item) => [item.code, item.name, item.system]);
        selectedStore.loadData(extData);
    } catch (e) {
        selected = [];
        const extData = selected.map((item) => [item.code, item.name, item.system]);
        selectedStore.loadData(extData);
    }

    const query = new Ext.form.field.Text({
        name: 'query',
        fieldLabel: 'Suche',
        padding: 8,
        listeners: {
            change: (f, e) => {
                queryString = f.value;
                request(f.value);
                if (f.value.length > 0) {
                    Ext.getCmp('btnUnknownAgent').setDisabled(false);
                } else {
                    Ext.getCmp('btnUnknownAgent').setDisabled(true);
                }
            }
        }
    });

    const gridColumns = [
        { header: 'Code', width: 74, sortable: false, dataIndex: 'code' },
        { header: 'Name', width: 340, sortable: false, dataIndex: 'name' },
        { header: 'System', width: 74, sortable: false, dataIndex: 'system' },
    ];

    const grid = new Ext.grid.GridPanel({
        title: 'Verfügbar',
        store: requestedStore,
        loadMask: true,
        border: true,
        columns: gridColumns,
        //viewConfig: { forceFit: true },
        listeners: {
            itemclick: (dv, record, item, index, e) => {
                selectedItemIndex = index;
                Ext.getCmp('btnAddAgent').setDisabled(false);
            },
            itemdbclick: (dv, record, item, index, e) => {
                selectedItemIndex = index;
                Ext.getCmp('btnAddAgent').setDisabled(false);
            }
        }
    });

    const selectedGrid = new Ext.grid.GridPanel({
        title: 'Ausgewählt',
        store: selectedStore,
        loadMask: true,
        border: true,
        columns: gridColumns,
        //viewConfig: { forceFit: true },
        listeners: {
            itemclick: (dv, record, item, index, e) => {
                deselectedItemIndex = index;
                Ext.getCmp('btnRmAgent').setDisabled(false);
            },
            itemdbclick: (dv, record, item, index, e) => {
                deselectedItemIndex = index;
                Ext.getCmp('btnRmAgent').setDisabled(false);
            }
        }
    });

    const gridLayout = Ext.create('Ext.Panel', {
        layout: {
            type: 'hbox'
        },
        items: [grid, selectedGrid]
    });

    const layout = Ext.create('Ext.Panel', {
        layout: {
            type: 'vbox'
        },
        items: [query, gridLayout]
    });

    Ext.create('Ext.window.Window', {
        title: 'Substanz auswählen',
        height: 600,
        width: 1000,
        layout: 'fit',
        items: [layout],
        buttons: [{
            id: 'btnAddAgent',
            text: 'Hinzufügen',
            disabled: true,
            handler: () => {
                addItem(requested[selectedItemIndex]);
                Ext.getCmp('btnAddAgent').setDisabled(true);
            }
        }, {
            id: 'btnUnknownAgent',
            text: 'Aus Suchfeld hinzufügen',
            disabled: true,
            handler: () => {
                addItem({
                    code: '',
                    name: queryString,
                    system: 'UNREGISTERED'
                });
                Ext.getCmp('btnUnknownAgent').setDisabled(true);
            }
        }, {
            id: 'btnRmAgent',
            text: 'Entfernen',
            disabled: true,
            handler: () => {
                removeItem(deselectedItemIndex);
                Ext.getCmp('btnRmAgent').setDisabled(true);
            }
        }, {
            text: 'Übernehmen',
            cls: 'onko-btn-cta',
            handler: () => {
                save();
                var win = Ext.WindowManager.getActive();
                if (win) {
                    win.close();
                }
            }
        }]
    }).show();

    request('');
};

showDialog();