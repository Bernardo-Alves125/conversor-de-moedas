import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Lista de moedas populares
const CURRENCIES = [
  { code: 'BRL', name: 'Real Brasileiro', flag: '🇧🇷' },
  { code: 'USD', name: 'Dólar Americano', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧' },
  { code: 'JPY', name: 'Iene Japonês', flag: '🇯🇵' },
  { code: 'CAD', name: 'Dólar Canadense', flag: '🇨🇦' },
  { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺' },
  { code: 'CHF', name: 'Franco Suíço', flag: '🇨🇭' },
  { code: 'CNY', name: 'Yuan Chinês', flag: '🇨🇳' },
  { code: 'ARS', name: 'Peso Argentino', flag: '🇦🇷' },
  { code: 'MXN', name: 'Peso Mexicano', flag: '🇲🇽' },
  { code: 'BTC', name: 'Bitcoin', flag: '₿' },
];

export default function App() {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('BRL');
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState(null);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Função para buscar a cotação
  const convertCurrency = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Digite um valor válido');
      return;
    }

    if (fromCurrency === toCurrency) {
      setResult(parseFloat(amount).toFixed(2));
      setRate(1);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      // Usando a API gratuita Frankfurter (sem chave necessária)
      // Para Bitcoin usamos uma abordagem diferente
      if (fromCurrency === 'BTC' || toCurrency === 'BTC') {
        // Fallback simples para BTC usando CoinGecko
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${fromCurrency === 'BTC' ? toCurrency.toLowerCase() : fromCurrency.toLowerCase()}`
        );
        const data = await response.json();
        
        if (fromCurrency === 'BTC') {
          const btcRate = data.bitcoin[toCurrency.toLowerCase()];
          const converted = parseFloat(amount) * btcRate;
          setResult(converted.toFixed(2));
          setRate(btcRate.toFixed(2));
        } else {
          const btcRate = data.bitcoin[fromCurrency.toLowerCase()];
          const converted = parseFloat(amount) / btcRate;
          setResult(converted.toFixed(8));
          setRate((1 / btcRate).toFixed(8));
        }
        setLastUpdate(new Date().toLocaleString('pt-BR'));
      } else {
        // API Frankfurter para moedas tradicionais
        const response = await fetch(
          `https://api.frankfurter.app/latest?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`
        );
        
        if (!response.ok) {
          throw new Error('Erro ao buscar cotação');
        }

        const data = await response.json();
        setResult(data.rates[toCurrency].toFixed(2));
        setRate((data.rates[toCurrency] / parseFloat(amount)).toFixed(4));
        setLastUpdate(new Date(data.date).toLocaleDateString('pt-BR'));
      }
    } catch (err) {
      console.error(err);
      setError('Não foi possível obter a cotação. Tente novamente.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Converte automaticamente quando muda as moedas (com debounce simples)
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const timer = setTimeout(() => {
        convertCurrency();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fromCurrency, toCurrency]);

  // Inverte as moedas
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getCurrencyInfo = (code) => {
    return CURRENCIES.find((c) => c.code === code) || { name: code, flag: '💱' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>💱 Conversor</Text>
          <Text style={styles.subtitle}>Cotações em tempo real</Text>
        </View>

        {/* Card principal */}
        <View style={styles.card}>
          
          {/* Valor de entrada */}
          <Text style={styles.label}>Valor</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Moeda de origem */}
          <Text style={styles.label}>De</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={fromCurrency}
              onValueChange={(itemValue) => setFromCurrency(itemValue)}
              style={styles.picker}
              dropdownIconColor="#f8fafc"
            >
              {CURRENCIES.map((currency) => (
                <Picker.Item
                  key={currency.code}
                  label={`${currency.flag} ${currency.code} - ${currency.name}`}
                  value={currency.code}
                  color="#0f172a"
                />
              ))}
            </Picker>
          </View>

          {/* Botão de inverter */}
          <TouchableOpacity style={styles.swapButton} onPress={swapCurrencies}>
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>

          {/* Moeda de destino */}
          <Text style={styles.label}>Para</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={toCurrency}
              onValueChange={(itemValue) => setToCurrency(itemValue)}
              style={styles.picker}
              dropdownIconColor="#f8fafc"
            >
              {CURRENCIES.map((currency) => (
                <Picker.Item
                  key={currency.code}
                  label={`${currency.flag} ${currency.code} - ${currency.name}`}
                  value={currency.code}
                  color="#0f172a"
                />
              ))}
            </Picker>
          </View>

          {/* Botão de converter */}
          <TouchableOpacity
            style={[styles.convertButton, loading && styles.buttonDisabled]}
            onPress={convertCurrency}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.convertButtonText}>Converter</Text>
            )}
          </TouchableOpacity>

          {/* Resultado */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {result !== null && !error && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Resultado</Text>
              <Text style={styles.resultValue}>
                {getCurrencyInfo(toCurrency).flag} {result} {toCurrency}
              </Text>
              {rate && (
                <Text style={styles.rateText}>
                  1 {fromCurrency} = {rate} {toCurrency}
                </Text>
              )}
              {lastUpdate && (
                <Text style={styles.updateText}>
                  Atualizado em: {lastUpdate}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Dica */}
        <Text style={styles.footer}>
          Dados fornecidos por Frankfurter.app e CoinGecko
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 12,
  },
  inputContainer: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    paddingVertical: 14,
  },
  pickerContainer: {
    backgroundColor: '#334155',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: '#f8fafc',
    height: 50,
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  swapIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  convertButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  convertButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  resultBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  rateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  updateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  errorText: {
    color: '#fca5a5',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 20,
  },
});
