import '../styles/global.css';
import { Provider } from 'react-redux';
import { Helmet } from 'react-helmet';
import { persistor, store } from '../context/store';
import type { AppProps } from 'next/app';
import { PersistGate } from 'redux-persist/integration/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Helmet>
          <link rel="stylesheet" href="/styles/global.css" />
          <link rel="stylesheet" href="/styles/hljs-horizon.css" />
        </Helmet>
        <Component {...pageProps} />
      </PersistGate>
    </Provider>
  );
}
