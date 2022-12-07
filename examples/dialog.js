const availableStore = new Ext.data.ArrayStore({
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

let pluginRequestsDisabled = false;
let available = [];
let selected = [];

const request = function (q) {
    if (pluginRequestsDisabled) return;
    executePluginMethod(
        'AtcCodesPlugin',
        'query',
        {q: q, size: 25},
        function (response) {
            if (response.status.code < 0) {
                onFailure();
                return;
            }
            onSuccess(response.result);
        },
        false
    );
};

const addItem = function (item) {
    selected.push(item);
    const extData = selected.map((item) => [item.code, item.name, item.system]);
    selectedStore.loadData(extData);
};

const removeItem = function (index) {
    selected.splice(index, 1);
    const extData = selected.map((item) => [item.code, item.name, item.system]);
    selectedStore.loadData(extData);
};

const save = function () {
    const names = selected.map((item) => {
        return item.name;
    }).join("\n");
    setFieldValue('wirkstoffe', names);
    setFieldValue('wirkstoffejson', JSON.stringify(selected));
};

const onFailure = function() {
    pluginRequestsDisabled = true;
    Ext.MessageBox.show({
        title: 'Hinweis',
        msg: 'Plugin "ATC-Codes und Substanzen" nicht verfügbar. Sie können Substanzen nur über "Aus Suchfeld hinzufügen" hinzufügen.',
        buttons: Ext.MessageBox.OKCANCEL
    });
};

const onSuccess = function(d) {
    available = d;
    const extData = available.map((item) => [item.code, item.name, item.system]);
    availableStore.loadData(extData);
}

const showDialog = function () {
    let selectedItemIndex = -1;
    let deselectedItemIndex = -1;
    let queryString = '';

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
            change: (f) => {
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
        {header: 'Code', width: 74, sortable: false, dataIndex: 'code'},
        {header: 'Name', width: 340, sortable: false, dataIndex: 'name'},
        {header: 'System', width: 74, sortable: false, dataIndex: 'system'},
    ];

    const availableGrid = new Ext.grid.GridPanel({
        title: 'Verfügbar',
        store: availableStore,
        loadMask: true,
        border: true,
        columns: gridColumns,
        listeners: {
            itemclick: (dv, record, item, index) => {
                selectedItemIndex = index;
                Ext.getCmp('btnAddAgent').setDisabled(false);
            },
            itemdbclick: (dv, record, item, index) => {
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
        listeners: {
            itemclick: (dv, record, item, index) => {
                deselectedItemIndex = index;
                Ext.getCmp('btnRmAgent').setDisabled(false);
            },
            itemdbclick: (dv, record, item, index) => {
                deselectedItemIndex = index;
                Ext.getCmp('btnRmAgent').setDisabled(false);
            }
        }
    });

    const gridLayout = Ext.create('Ext.Panel', {
        layout: {
            type: 'hbox'
        },
        items: [availableGrid, selectedGrid]
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
                addItem(available[selectedItemIndex]);
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
                let win = Ext.WindowManager.getActive();
                if (win) {
                    win.close();
                }
            }
        }]
    }).show();

    request('');
};

showDialog();