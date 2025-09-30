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
                sortOrder: 'desc',
                selectedMonth: '',


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
                    let data = [...this.transactions];

                    // Filter berdasarkan tanggal
                    if (this.startDate && this.endDate) {
                        const start = new Date(this.startDate);
                        const end = new Date(this.endDate);

                        data = data.filter(t => {
                            const txDate = new Date(t.date);
                            return txDate >= start && txDate <= end;
                        });
                    }

                    // Sorting
                    data.sort((a, b) => {
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);

                        if (this.sortOrder === 'asc') {
                            return dateA - dateB;
                        } else if (this.sortOrder === 'desc') {
                            return dateB - dateA;
                        } else if (this.sortOrder === 'bulanAsc') {
                            // Urutkan dari Januari ke Desember (berdasarkan bulan)
                            return dateA.getMonth() - dateB.getMonth();
                        } else if (this.sortOrder === 'bulanDesc') {
                            // Urutkan dari Desember ke Januari
                            return dateB.getMonth() - dateA.getMonth();
                        }

                        return 0; // default: tidak diurutkan
                    });

                    if (this.selectedMonth !== '') {
                        data = data.filter(t => {
                            const txDate = new Date(t.date);
                            // getMonth() dari 0-11, selectedMonth dari 1-12
                            return (txDate.getMonth() + 1).toString().padStart(2, '0') === this.selectedMonth;
                        });
                    }

                    // Urutkan default berdasarkan tanggal terbaru
                    data.sort((a, b) => new Date(b.date) - new Date(a.date));

                    return data;
                },

                get isFilteredEmpty() {
                    return this.filteredTransactions.length === 0;
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

                hapusSemuaTransaksi() {
                    if (confirm('Apakah Anda yakin ingin menghapus semua transaksi?')) {
                        this.transactions = [];
                        this.saveTransactions();
                        this.updateChart();      
                    }
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
                                        text: 'Diagram Graphic'
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