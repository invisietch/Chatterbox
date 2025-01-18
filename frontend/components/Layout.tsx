import { ToastContainer, Bounce } from 'react-toastify';
import Navbar from './Navbar';
import Head from 'next/head';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Head>
        <title>Chatterbox - LLM Dataset Management</title>
        <meta property="og:title" content="Chatterbox - LLM Dataset Management" key="title" />
      </Head>
      <Navbar />
      <main className="container mx-auto p-4">{children}</main>
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />
    </div>
  );
};

export default Layout;
