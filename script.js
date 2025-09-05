document.addEventListener('alpine:init', () => {
            Alpine.data('financeApp', () => ({
                desc: '',
                amount: '',
                date: '',
                type: 'income',
                transactions: [],
                chart: null,
                startDate: '',
                endDate: '',

                formatDate(dateStr) {
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    return new Date(dateStr).toLocaleDateString('id-ID', options);
                },

                init() {
                    // Load dari localStorage
                    const savedTransactions = localStorage.getItem('financeTransactions');
                    if (savedTransactions) {
                        this.transactions = JSON.parse(savedTransactions);
                    }

                    this.$nextTick(() => {
                        this.updateChart();
                    });

                    // 🔁 Pantau perubahan tanggal, lalu update chart
                    this.$watch('startDate', () => this.updateChart());
                    this.$watch('endDate', () => this.updateChart());
                },

                get filteredTransactions() {
                    if (!this.startDate || !this.endDate) return this.transactions;

                    const start = new Date(this.startDate);
                    const end = new Date(this.endDate);

                    return this.transactions.filter(t => {
                        const txDate = new Date(t.date);
                        return txDate >= start && txDate <= end;
                    });
                },

                resetDateFilter() {
                this.startDate = '';
                this.endDate = '';
                this.updateChart(); // agar chart langsung diperbarui
            },
                
                get totalIncome() {
                    return this.filteredTransactions
                            .filter(t => t.type === 'income')
                            .reduce((sum, t) => sum + Number(t.amount), 0);
                },
                
                get totalExpense() {
                    return this.filteredTransactions
                            .filter(t => t.type === 'expense')
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
                    const incomeTotal = this.filteredTransactions
                        .filter(t => t.type === 'income')
                        .reduce((acc, t) => acc + t.amount, 0);

                    const expenseTotal = this.filteredTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((acc, t) => acc + t.amount, 0);

                    const data = {
                        labels: ['Pemasukan', 'Pengeluaran'],
                        datasets: [{
                            data: [incomeTotal, expenseTotal],
                            backgroundColor: ['#34d399', '#f87171'],
                        }]
                    };

                    if (!this.chart) {
                        const ctx = document.getElementById('transactionChart').getContext('2d');
                        this.chart = new Chart(ctx, {
                            type: 'doughnut',
                            data: data,
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                    },
                                    title: {
                                        display: true,
                                        text: 'Distribusi Keuangan Bulanan'
                                    }
                                }
                            }
                        });
                    } else {
                        // Update existing chart data
                        this.chart.data = data;
                        this.chart.update();
                    }
                }
            }));
        });