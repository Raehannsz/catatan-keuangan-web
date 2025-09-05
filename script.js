document.addEventListener('alpine:init', () => {
            Alpine.data('financeApp', () => ({
                desc: '',
                amount: '',
                date: '',
                type: 'income',
                transactions: [],
                chart: null,

                formatDate(dateStr) {
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    return new Date(dateStr).toLocaleDateString('id-ID', options);
                },

                
                init() {
                    // Load data dari localStorage jika ada
                    const savedTransactions = localStorage.getItem('financeTransactions');
                    if (savedTransactions) {
                        this.transactions = JSON.parse(savedTransactions);
                    }
                    
                    // Inisialisasi chart setelah Alpine selesai render
                    this.$nextTick(() => {
                        this.updateChart();
                    });
                },
                
                get totalIncome() {
                    return this.transactions.filter(t => t.type === 'income')
                                            .reduce((sum, t) => sum + Number(t.amount), 0);
                },
                
                get totalExpense() {
                    return this.transactions.filter(t => t.type === 'expense')
                                            .reduce((sum, t) => sum + Number(t.amount), 0);
                },
                
                get balance() {
                    return this.totalIncome - this.totalExpense;
                },
                
                formatCurrency(amount) {
                    return new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(amount);
                },
                
                addTransaction() {
                    if (!this.desc.trim() || !this.amount || !this.date || Number(this.amount) <= 0) {
                        alert('Deskripsi, jumlah, dan tanggal harus diisi dengan benar!');
                        return;
                    }

                    this.transactions.push({ 
                        desc: this.desc.trim(), 
                        amount: Number(this.amount),
                        date: this.date,
                        type: this.type,
                    });

                    // Simpan ke localStorage
                    this.saveTransactions();

                    // Reset form
                    this.desc = '';
                    this.amount = '';
                    this.date = '';
                    this.type = 'income'; // Optional: reset ke default

                    // Update chart
                    this.updateChart();
                },

                
                removeTransaction(index) {
                    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
                        this.transactions.splice(index, 1);
                        this.saveTransactions();
                        this.updateChart();
                    }
                },
                
                saveTransactions() {
                    localStorage.setItem('financeTransactions', JSON.stringify(this.transactions));
                },

                formatDate(dateStr) {
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    return new Date(dateStr).toLocaleDateString('id-ID', options);
                },
                
                updateChart() {
                    const incomes = this.totalIncome;
                    const expenses = this.totalExpense;
                    
                    const ctx = document.getElementById('transactionChart').getContext('2d');
                    
                    // Hancurkan chart sebelumnya jika ada
                    if (this.chart) {
                        this.chart.destroy();
                    }
                    
                    // Buat chart baru
                    this.chart = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Pemasukan', 'Pengeluaran'],
                            datasets: [{
                                label: 'Transaksi',
                                data: [incomes, expenses],
                                backgroundColor: ['#34d399', '#f87171'],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => {
                                            return `${context.label}: ${this.formatCurrency(context.raw)}`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }));
        });