/**
 * Oyun Tasarımcısı JavaScript Kodu
 * Sürükle-bırak ve tasarım yönetimi işlevlerini içerir
 */

// Global değişkenler
let selectedElement = null;
let currentDesignData = {
    homeScreen: [],
    gameCards: [],
    gameScreen: []
};

// Tasarımcıyı başlat
function initDesigner(gameId, designSettings) {
    console.log('Tasarımcı başlatılıyor, Oyun ID:', gameId);
    
    // Mevcut tasarım verilerini yükle
    if (designSettings && Object.keys(designSettings).length > 0) {
        currentDesignData = designSettings;
        loadDesignElements();
    }
    
    setupDragAndDrop();
    setupPropertyHandlers();
    updatePreview();
}

// Sürükle bırak işlevselliğini kur
function setupDragAndDrop() {
    // Palettten öğe sürükleme
    $('.palette-item').draggable({
        helper: 'clone',
        appendTo: 'body',
        zIndex: 1000,
        start: function(event, ui) {
            $(ui.helper).addClass('dragging-element');
        }
    });
    
    // Tasarım alanlarına bırakma
    $('.designer-container').droppable({
        accept: '.palette-item',
        drop: function(event, ui) {
            const designerArea = $(this);
            const elementType = ui.draggable.data('type');
            const areaId = designerArea.attr('id');
            
            // Konumu hesapla
            const container = designerArea.offset();
            const xPos = (ui.offset.left - container.left);
            const yPos = (ui.offset.top - container.top);
            
            // Yeni öğe oluştur
            createDesignElement(elementType, areaId, {
                left: xPos + 'px',
                top: yPos + 'px'
            });
        }
    });
    
    // Tasarım alanlarında öğe seçme
    $(document).on('click', '.design-element', function(e) {
        e.stopPropagation();
        selectElement($(this));
    });
    
    // Boş alana tıklayınca seçimi kaldır
    $('.designer-container').on('click', function() {
        deselectElements();
    });
    
    // Öğe silme
    $(document).on('click', '.delete-element', function(e) {
        e.stopPropagation();
        const element = $(this).closest('.design-element');
        deleteElement(element);
    });
    
    // Öğe düzenleme
    $(document).on('click', '.edit-element', function(e) {
        e.stopPropagation();
        const element = $(this).closest('.design-element');
        selectElement(element);
    });
    
    // Öğe klonlama
    $(document).on('click', '.clone-element', function(e) {
        e.stopPropagation();
        const element = $(this).closest('.design-element');
        cloneElement(element);
    });
    
    // Öğeleri sürükleyerek konumlandırma
    setupElementDragging();
    
    // Öğeleri yeniden boyutlandırma
    setupElementResizing();
}

// Öğe sürükleme fonksiyonu
function setupElementDragging() {
    $('.designer-container').sortable({
        items: '.design-element',
        containment: 'parent',
        handle: '.element-handle',
        start: function(event, ui) {
            selectElement(ui.item);
        },
        stop: function(event, ui) {
            updateDesignData();
            updatePreview();
        }
    });
    
    interact('.design-element').draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
            })
        ],
        autoScroll: true,
        listeners: {
            move: dragMoveListener,
            end: function(event) {
                updateDesignData();
                updatePreview();
            }
        }
    });
}

// Öğe boyutlandırma fonksiyonu
function setupElementResizing() {
    interact('.design-element').resizable({
        edges: { left: false, right: true, bottom: true, top: false },
        listeners: {
            move: resizeMoveListener
        },
        modifiers: [
            interact.modifiers.restrictEdges({
                outer: 'parent'
            }),
            interact.modifiers.restrictSize({
                min: { width: 50, height: 30 }
            })
        ],
        inertia: true
    });
}

// Sürükleme hareket yöneticisi
function dragMoveListener(event) {
    const target = event.target;
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    
    // Pozisyonu güncelle
    target.style.left = x + 'px';
    target.style.top = y + 'px';
    
    // data-x ve data-y özniteliklerini güncelle
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

// Boyutlandırma hareket yöneticisi
function resizeMoveListener(event) {
    const target = event.target;
    let x = (parseFloat(target.getAttribute('data-x')) || 0);
    let y = (parseFloat(target.getAttribute('data-y')) || 0);
    
    // Genişlik ve yüksekliği güncelle
    target.style.width = event.rect.width + 'px';
    target.style.height = event.rect.height + 'px';
    
    // Boyut değişikliğiyle birlikte konum değişikliğini telafi et
    x += event.deltaRect.left;
    y += event.deltaRect.top;
    
    target.style.left = x + 'px';
    target.style.top = y + 'px';
    
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

// Yeni tasarım öğesi oluştur
function createDesignElement(type, containerId, position) {
    const container = $(`#${containerId}`);
    const elementId = 'element-' + Date.now();
    let elementHtml = '';
    
    switch(type) {
        case 'text':
            elementHtml = `
                <div id="${elementId}" class="design-element" style="left:${position.left}; top:${position.top};" data-type="text">
                    <div class="element-content">Metin Öğesi</div>
                    <div class="element-actions">
                        <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                        <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="resizable-handle resizable-se"></div>
                </div>
            `;
            break;
        case 'button':
            elementHtml = `
                <div id="${elementId}" class="design-element" style="left:${position.left}; top:${position.top};" data-type="button">
                    <div class="element-content">
                        <button class="btn btn-primary">Buton</button>
                    </div>
                    <div class="element-actions">
                        <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                        <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="resizable-handle resizable-se"></div>
                </div>
            `;
            break;
        case 'image':
            elementHtml = `
                <div id="${elementId}" class="design-element" style="left:${position.left}; top:${position.top};" data-type="image">
                    <div class="element-content">
                        <img src="/static/images/placeholder.jpg" style="max-width:100%; height:auto;" alt="Resim">
                    </div>
                    <div class="element-actions">
                        <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                        <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="resizable-handle resizable-se"></div>
                </div>
            `;
            break;
        case 'card':
            elementHtml = `
                <div id="${elementId}" class="design-element" style="left:${position.left}; top:${position.top};" data-type="card">
                    <div class="element-content">
                        <div class="card">
                            <div class="card-header">Kart Başlığı</div>
                            <div class="card-body">
                                <p>Kart içeriği buraya gelecek</p>
                            </div>
                        </div>
                    </div>
                    <div class="element-actions">
                        <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                        <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="resizable-handle resizable-se"></div>
                </div>
            `;
            break;
        case 'game_card':
            elementHtml = `
                <div id="${elementId}" class="design-element" style="left:${position.left}; top:${position.top};" data-type="game_card">
                    <div class="element-content">
                        <div class="card">
                            <img class="card-img-top" src="/static/images/placeholder.jpg" alt="Oyun Görseli">
                            <div class="card-body">
                                <h5 class="card-title">Oyun Adı</h5>
                                <p class="card-text">Oyun açıklaması</p>
                                <button class="btn btn-primary">Oyna</button>
                            </div>
                        </div>
                    </div>
                    <div class="element-actions">
                        <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                        <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="resizable-handle resizable-se"></div>
                </div>
            `;
            break;
        case 'score_card':
            elementHtml = `
                <div id="${elementId}" class="design-element" style="left:${position.left}; top:${position.top};" data-type="score_card">
                    <div class="element-content">
                        <div class="card">
                            <div class="card-header">Skor Tablosu</div>
                            <div class="card-body">
                                <ul class="list-group">
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Kullanıcı 1
                                        <span class="badge badge-primary badge-pill">1000</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Kullanıcı 2
                                        <span class="badge badge-primary badge-pill">850</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="element-actions">
                        <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                        <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="resizable-handle resizable-se"></div>
                </div>
            `;
            break;
        case 'container':
            elementHtml = `
                <div id="${elementId}" class="design-element" style="left:${position.left}; top:${position.top}; min-height:100px; min-width:200px;" data-type="container">
                    <div class="element-content" style="width:100%; height:100%; border:1px dashed #aaa; background:#f9f9f9; display:flex; align-items:center; justify-content:center;">
                        <div>Konteyner</div>
                    </div>
                    <div class="element-actions">
                        <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                        <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="resizable-handle resizable-se"></div>
                </div>
            `;
            break;
        default:
            elementHtml = `
                <div id="${elementId}" class="design-element" style="left:${position.left}; top:${position.top};" data-type="${type}">
                    <div class="element-content">${type} Öğesi</div>
                    <div class="element-actions">
                        <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                        <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="resizable-handle resizable-se"></div>
                </div>
            `;
            break;
    }
    
    // Yeni oluşturulan öğeyi ekle
    container.append(elementHtml);
    
    // Oluşturulan öğeyi seç
    selectElement($(`#${elementId}`));
    
    // Tasarım verilerini güncelle
    updateDesignData();
    
    // Sürükleme ve boyutlandırmayı kur
    setupElementDragging();
    setupElementResizing();
    
    // Önizlemeyi güncelle
    updatePreview();
}

// Öğe seç
function selectElement(element) {
    // Önce tüm öğelerin seçimini kaldır
    deselectElements();
    
    // Öğeyi seç
    element.addClass('ui-selected');
    selectedElement = element;
    
    // Öğe özelliklerini göster
    showElementProperties(element);
}

// Tüm öğelerin seçimini kaldır
function deselectElements() {
    $('.design-element').removeClass('ui-selected');
    selectedElement = null;
    
    // Özellik formunu gizle
    $('#propertiesForm').hide();
    $('#elementProperties p').show();
}

// Öğe silme
function deleteElement(element) {
    const elementId = element.attr('id');
    
    // DOM'dan kaldır
    element.remove();
    
    // Veriyi güncelle
    updateDesignData();
    
    // Önizlemeyi güncelle
    updatePreview();
    
    // Seçili öğe silinmişse özellikleri gizle
    if (selectedElement && selectedElement.attr('id') === elementId) {
        deselectElements();
    }
}

// Öğe klonlama
function cloneElement(element) {
    const elementType = element.data('type');
    const containerId = element.closest('.designer-container').attr('id');
    const position = {
        left: (parseInt(element.css('left')) + 20) + 'px',
        top: (parseInt(element.css('top')) + 20) + 'px'
    };
    
    // Yeni bir kopyasını oluştur
    createDesignElement(elementType, containerId, position);
}

// Öğe özelliklerini göster
function showElementProperties(element) {
    const elementType = element.data('type');
    const content = element.find('.element-content');
    
    // Form görünürlüğünü değiştir
    $('#elementProperties p').hide();
    $('#propertiesForm').show();
    
    // Mevcut değerleri form alanlarına doldur
    if (elementType === 'text') {
        $('#elementText').val(content.text());
    } else if (elementType === 'button') {
        $('#elementText').val(content.find('button').text());
    }
    
    // Diğer stil özellikleri
    let bgColor = content.css('background-color');
    let fontColor = content.css('color');
    let fontSize = parseInt(content.css('font-size'));
    let borderColor = content.css('border-color');
    let borderWidth = parseInt(content.css('border-width'));
    let borderRadius = parseInt(content.css('border-radius'));
    let padding = parseInt(content.css('padding'));
    
    // Form değerlerini doldur
    $('#elementBgColor').val(rgbToHex(bgColor));
    $('#elementColor').val(rgbToHex(fontColor));
    $('#elementFontSize').val(fontSize || 16);
    $('#fontSizeValue').text((fontSize || 16) + 'px');
    $('#elementBorderColor').val(rgbToHex(borderColor));
    $('#elementBorderWidth').val(borderWidth || 1);
    $('#borderWidthValue').text((borderWidth || 1) + 'px');
    $('#elementBorderRadius').val(borderRadius || 4);
    $('#borderRadiusValue').text((borderRadius || 4) + 'px');
    $('#elementPadding').val(padding || 10);
    $('#paddingValue').text((padding || 10) + 'px');
}

// Özellik değişikliği için olay yöneticileri kur
function setupPropertyHandlers() {
    // Metin değişikliği
    $('#elementText').on('input', function() {
        if (!selectedElement) return;
        
        const elementType = selectedElement.data('type');
        const content = selectedElement.find('.element-content');
        const text = $(this).val();
        
        if (elementType === 'text') {
            content.text(text);
        } else if (elementType === 'button') {
            content.find('button').text(text);
        }
        
        updateDesignData();
        updatePreview();
    });
    
    // Renk değişiklikleri
    $('#elementColor').on('input', function() {
        if (!selectedElement) return;
        selectedElement.find('.element-content').css('color', $(this).val());
        updateDesignData();
        updatePreview();
    });
    
    $('#elementBgColor').on('input', function() {
        if (!selectedElement) return;
        selectedElement.find('.element-content').css('background-color', $(this).val());
        updateDesignData();
        updatePreview();
    });
    
    // Yazı boyutu değişikliği
    $('#elementFontSize').on('input', function() {
        if (!selectedElement) return;
        const value = $(this).val() + 'px';
        $('#fontSizeValue').text(value);
        selectedElement.find('.element-content').css('font-size', value);
        updateDesignData();
        updatePreview();
    });
    
    // Kenarlık rengi değişikliği
    $('#elementBorderColor').on('input', function() {
        if (!selectedElement) return;
        selectedElement.find('.element-content').css('border-color', $(this).val());
        updateDesignData();
        updatePreview();
    });
    
    // Kenarlık kalınlığı değişikliği
    $('#elementBorderWidth').on('input', function() {
        if (!selectedElement) return;
        const value = $(this).val() + 'px';
        $('#borderWidthValue').text(value);
        selectedElement.find('.element-content').css('border-width', value);
        updateDesignData();
        updatePreview();
    });
    
    // Köşe yuvarlaklığı değişikliği
    $('#elementBorderRadius').on('input', function() {
        if (!selectedElement) return;
        const value = $(this).val() + 'px';
        $('#borderRadiusValue').text(value);
        selectedElement.find('.element-content').css('border-radius', value);
        updateDesignData();
        updatePreview();
    });
    
    // İç boşluk değişikliği
    $('#elementPadding').on('input', function() {
        if (!selectedElement) return;
        const value = $(this).val() + 'px';
        $('#paddingValue').text(value);
        selectedElement.find('.element-content').css('padding', value);
        updateDesignData();
        updatePreview();
    });
}

// RGB rengini Hex'e dönüştür
function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') {
        return '#ffffff';
    }
    
    // rgb(r, g, b) formatını kontrol et
    const rgbRegex = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;
    const match = rgb.match(rgbRegex);
    
    if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    return rgb; // Zaten hex ise
}

// Tasarım verilerini güncelle
function updateDesignData() {
    // Tüm tasarım alanlarını döngüyle kontrol et
    ['homeScreen', 'gameCards', 'gameScreen'].forEach((area, index) => {
        const areaElements = [];
        const designerId = ['homeScreenDesigner', 'gameCardsDesigner', 'gameScreenDesigner'][index];
        
        // Her alandaki öğeleri topla
        $(`#${designerId} .design-element`).each(function() {
            const element = $(this);
            const elementId = element.attr('id');
            const elementType = element.data('type');
            const content = element.find('.element-content');
            
            // Öğe verilerini oluştur
            const elementData = {
                id: elementId,
                type: elementType,
                position: {
                    left: element.css('left'),
                    top: element.css('top')
                },
                size: {
                    width: element.css('width'),
                    height: element.css('height')
                },
                style: {
                    color: content.css("color") || "#000000",
                    backgroundColor: content.css("background-color") || "transparent",
                    fontSize: content.css("font-size") || "16px",
                    borderColor: content.css("border-color") || "transparent",
                    borderWidth: content.css("border-width") || "0px",
                    borderRadius: content.css("border-radius") || "0px",
                    padding: content.css("padding") || "0px"
                },
                content: ''
            };
            
            // İçerik türüne göre içerik bilgisi al
            if (elementType === 'text') {
                elementData.content = content.text();
            } else if (elementType === 'button') {
                elementData.content = content.find('button').text();
            } else if (elementType === 'image') {
                elementData.content = content.find('img').attr('src');
            } else if (elementType === 'card' || elementType === 'game_card' || elementType === 'score_card') {
                elementData.content = content.html();
            }
            
            areaElements.push(elementData);
        });
        
        // Alanın verilerini güncelle
        currentDesignData[area] = areaElements;
    });
    
    console.log('Tasarım verileri güncellendi:', currentDesignData);
}

// Tasarım öğelerini yükle
function loadDesignElements() {
    // Her tasarım alanı için verileri işle
    ['homeScreen', 'gameCards', 'gameScreen'].forEach((area, index) => {
        const designerId = ['homeScreenDesigner', 'gameCardsDesigner', 'gameScreenDesigner'][index];
        const elements = currentDesignData[area] || [];
        
        // Önce alanı temizle
        $(`#${designerId}`).empty();
        
        // Öğeleri yükle
        elements.forEach(element => {
            let elementHtml = '';
            
            // Öğe türüne göre HTML oluştur
            switch(element.type) {
                case 'text':
                    elementHtml = `
                        <div id="${element.id}" class="design-element" style="left:${element.position.left}; top:${element.position.top}; width:${element.size.width}; height:${element.size.height};" data-type="text">
                            <div class="element-content" style="color:${element.style.color}; background-color:${element.style.backgroundColor}; font-size:${element.style.fontSize}; border-color:${element.style.borderColor}; border-width:${element.style.borderWidth}; border-radius:${element.style.borderRadius}; padding:${element.style.padding};">
                                ${element.content}
                            </div>
                            <div class="element-actions">
                                <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                                <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                                <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                            </div>
                            <div class="resizable-handle resizable-se"></div>
                        </div>
                    `;
                    break;
                    
                case 'button':
                    elementHtml = `
                        <div id="${element.id}" class="design-element" style="left:${element.position.left}; top:${element.position.top}; width:${element.size.width}; height:${element.size.height};" data-type="button">
                            <div class="element-content" style="color:${element.style.color}; background-color:${element.style.backgroundColor}; font-size:${element.style.fontSize}; border-color:${element.style.borderColor}; border-width:${element.style.borderWidth}; border-radius:${element.style.borderRadius}; padding:${element.style.padding};">
                                <button class="btn btn-primary">${element.content}</button>
                            </div>
                            <div class="element-actions">
                                <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                                <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                                <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                            </div>
                            <div class="resizable-handle resizable-se"></div>
                        </div>
                    `;
                    break;
                    
                default:
                    elementHtml = `
                        <div id="${element.id}" class="design-element" style="left:${element.position.left}; top:${element.position.top}; width:${element.size.width}; height:${element.size.height};" data-type="${element.type}">
                            <div class="element-content" style="color:${element.style.color}; background-color:${element.style.backgroundColor}; font-size:${element.style.fontSize}; border-color:${element.style.borderColor}; border-width:${element.style.borderWidth}; border-radius:${element.style.borderRadius}; padding:${element.style.padding};">
                                ${element.content}
                            </div>
                            <div class="element-actions">
                                <button class="edit-element" title="Düzenle"><i class="fas fa-edit"></i></button>
                                <button class="clone-element" title="Kopyala"><i class="fas fa-copy"></i></button>
                                <button class="delete-element" title="Sil"><i class="fas fa-trash"></i></button>
                            </div>
                            <div class="resizable-handle resizable-se"></div>
                        </div>
                    `;
                    break;
            }
            
            // Öğeyi ekle
            $(`#${designerId}`).append(elementHtml);
        });
    });
    
    // Sürükleme ve boyutlandırmayı kur
    setupElementDragging();
    setupElementResizing();
    
    // Önizlemeyi güncelle
    updatePreview();
}

// Şablon yükle
function loadTemplate(templateId) {
    // Seçili sekmedeki tasarım alanı
    const activeTab = $('.designer-tabs .nav-link.active').attr('href');
    let designerId = '';
    let area = '';
    
    if (activeTab === '#home-screen') {
        designerId = 'homeScreenDesigner';
        area = 'homeScreen';
    } else if (activeTab === '#game-cards') {
        designerId = 'gameCardsDesigner';
        area = 'gameCards';
    } else if (activeTab === '#game-screen') {
        designerId = 'gameScreenDesigner';
        area = 'gameScreen';
    }
    
    // Kullanıcı onayı al
    if (!confirm('Bu işlem mevcut tasarımı silip şablonu yükleyecek. Emin misiniz?')) {
        return;
    }
    
    // Şablon verilerini al
    let templateData = [];
    
    switch(templateId) {
        case 'default_game_screen':
            templateData = [
                {
                    id: 'element-' + Date.now(),
                    type: 'text',
                    position: { left: '50px', top: '50px' },
                    size: { width: '300px', height: 'auto' },
                    style: {
                        color: '#000000',
                        backgroundColor: 'transparent',
                        fontSize: '24px',
                        borderColor: 'transparent',
                        borderWidth: '0px',
                        borderRadius: '0px',
                        padding: '10px'
                    },
                    content: 'Oyun Başlığı'
                },
                {
                    id: 'element-' + (Date.now() + 1),
                    type: 'button',
                    position: { left: '50px', top: '150px' },
                    size: { width: '120px', height: 'auto' },
                    style: {
                        color: '#ffffff',
                        backgroundColor: 'transparent',
                        fontSize: '16px',
                        borderColor: 'transparent',
                        borderWidth: '0px',
                        borderRadius: '4px',
                        padding: '10px'
                    },
                    content: 'Başla'
                }
            ];
            break;
            
        case 'card_layout':
            // 2x2 kart düzeni
            const cards = [];
            const startTime = Date.now();
            
            for (let i = 0; i < 4; i++) {
                cards.push({
                    id: 'element-' + (startTime + i),
                    type: 'game_card',
                    position: { 
                        left: (i % 2) * 220 + 50 + 'px', 
                        top: Math.floor(i / 2) * 220 + 50 + 'px' 
                    },
                    size: { width: '200px', height: '200px' },
                    style: {
                        color: '#000000',
                        backgroundColor: '#ffffff',
                        fontSize: '16px',
                        borderColor: '#dddddd',
                        borderWidth: '1px',
                        borderRadius: '8px',
                        padding: '10px'
                    },
                    content: `
                        <div class="card">
                            <img class="card-img-top" src="/static/images/placeholder.jpg" alt="Oyun ${i+1}">
                            <div class="card-body">
                                <h5 class="card-title">Oyun ${i+1}</h5>
                                <button class="btn btn-primary btn-sm">Oyna</button>
                            </div>
                        </div>
                    `
                });
            }
            
            templateData = cards;
            break;
    }
    
    // Mevcut alanı temizle
    $(`#${designerId}`).empty();
    
    // Şablon verilerini yükle
    currentDesignData[area] = templateData;
    loadDesignElements();
}

// Önizlemeyi güncelle
function updatePreview() {
    // Aktif sekmeye göre önizleme alanını güncelleme
    const activeTab = $('.designer-tabs .nav-link.active').attr('href');
    let area = '';
    
    if (activeTab === '#home-screen') {
        area = 'homeScreen';
    } else if (activeTab === '#game-cards') {
        area = 'gameCards';
    } else if (activeTab === '#game-screen') {
        area = 'gameScreen';
    }
    
    // Önizleme HTML'i oluştur
    let previewHtml = '';
    const elements = currentDesignData[area] || [];
    
    elements.forEach(element => {
        // Öğe türüne göre önizleme HTML'i
        let elementHtml = '';
        
        switch(element.type) {
            case 'text':
                elementHtml = `
                    <div style="position:absolute; left:${element.position.left}; top:${element.position.top}; color:${element.style.color}; background-color:${element.style.backgroundColor}; font-size:${element.style.fontSize}; border-color:${element.style.borderColor}; border-width:${element.style.borderWidth}; border-radius:${element.style.borderRadius}; padding:${element.style.padding};">
                        ${element.content}
                    </div>
                `;
                break;
                
            case 'button':
                elementHtml = `
                    <div style="position:absolute; left:${element.position.left}; top:${element.position.top};">
                        <button class="btn btn-primary">${element.content}</button>
                    </div>
                `;
                break;
                
            default:
                elementHtml = `
                    <div style="position:absolute; left:${element.position.left}; top:${element.position.top}; color:${element.style.color}; background-color:${element.style.backgroundColor}; font-size:${element.style.fontSize}; border-color:${element.style.borderColor}; border-width:${element.style.borderWidth}; border-radius:${element.style.borderRadius}; padding:${element.style.padding};">
                        ${element.content}
                    </div>
                `;
                break;
        }
        
        previewHtml += elementHtml;
    });
    
    // Önizleme alanını güncelle
    $('#previewArea').html(previewHtml);
}

// Tasarım kaydetme
function saveDesign(gameId) {
    // Mevcut tasarım verilerini güncelle
    updateDesignData();
    
    try {
        // Tasarım verilerini JSON olarak hazırla
        const designData = JSON.stringify(currentDesignData);
        console.log("Gönderilecek veri:", designData);
        
        // Tasarım verilerini sunucuya gönder
        $.ajax({
            url: `/admin/game-designer/${gameId}/update`,
            type: "POST",
            contentType: "application/json",
            data: designData,
            beforeSend: function() {
                console.log("Tasarım verileri gönderiliyor...");
            },
            success: function(response) {
                if (response.success) {
                    alert("Tasarım başarıyla kaydedildi.");
                    console.log("Başarılı cevap:", response);
                } else {
                    alert("Hata: " + response.message);
                    console.error("Sunucu hatası:", response.message);
                }
            },
            error: function(xhr, status, error) {
                alert("İşlem sırasında bir hata oluştu: " + error);
                console.error("Ajax hatası:", status, error);
                console.error("XHR detayları:", xhr.status, xhr.responseText);
            }
        });
    } catch (e) {
        console.error("Tasarım kaydetme hatası:", e);
        alert("Tasarım kaydedilirken bir hata oluştu: " + e.message);
    }
    });
}
