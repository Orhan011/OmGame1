document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Kullanıcı tercihini localStorage'da sakla
            if (sidebar.classList.contains('collapsed')) {
                localStorage.setItem('sidebar-collapsed', 'true');
            } else {
                localStorage.setItem('sidebar-collapsed', 'false');
            }
        });
    }
    
    if (sidebarToggleMobile) {
        sidebarToggleMobile.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Sayfa yüklendiğinde kullanıcı tercihine göre sidebar durumunu ayarla
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }
    
    // Tablo satırlarına hover efekti
    const tableRows = document.querySelectorAll('.table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.classList.add('bg-light');
        });
        
        row.addEventListener('mouseleave', function() {
            this.classList.remove('bg-light');
        });
    });
    
    // Mobil görünümde tıklama ile sidebar'ı kapat
    document.addEventListener('click', function(event) {
        if (window.innerWidth < 992) {
            if (!sidebar.contains(event.target) && !sidebarToggleMobile.contains(event.target) && sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
            }
        }
    });
    
    // DataTables inicializasyonu (eğer varsa)
    if ($.fn.DataTable && document.querySelector('.datatable')) {
        $('.datatable').DataTable({
            language: {
                url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Turkish.json'
            },
            responsive: true
        });
    }
    
    // Select2 inicializasyonu (eğer varsa)
    if ($.fn.select2 && document.querySelector('.select2')) {
        $('.select2').select2({
            language: 'tr'
        });
    }
    
    // TinyMCE inicializasyonu (eğer varsa)
    if (typeof tinymce !== 'undefined' && document.querySelector('.tinymce')) {
        tinymce.init({
            selector: '.tinymce',
            height: 400,
            menubar: false,
            plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount'
            ],
            toolbar: 'undo redo | formatselect | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
            language: 'tr',
            language_url: '/static/admin/js/tinymce/langs/tr.js'
        });
    }
    
    // Chart.js inicializasyonu (eğer varsa)
    if (typeof Chart !== 'undefined' && document.getElementById('visitsChart')) {
        var ctx = document.getElementById('visitsChart').getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                datasets: [{
                    label: 'Ziyaret Sayısı',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: 'rgba(78, 115, 223, 0.05)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(78, 115, 223, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Silme işlemlerini onaylama 
    const deleteButtons = document.querySelectorAll('[data-confirm]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm(this.getAttribute('data-confirm'))) {
                e.preventDefault();
            }
        });
    });
    
    // Dosya yükleme önizlemesi
    const fileInputs = document.querySelectorAll('.custom-file-input');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const fileName = this.files[0].name;
            const fileLabel = this.nextElementSibling;
            fileLabel.textContent = fileName;
            
            // Görsel önizleme (eğer varsa)
            if (this.dataset.preview) {
                const fileReader = new FileReader();
                const previewElement = document.getElementById(this.dataset.preview);
                
                fileReader.onload = function(e) {
                    previewElement.src = e.target.result;
                };
                
                fileReader.readAsDataURL(this.files[0]);
            }
        });
    });
});
