import Link from 'next/link';
import { useRouter } from 'next/router';
import SettingsBox from './SettingsBox';

const Navbar = () => {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Conversations' },
    { href: '/tags', label: 'Tags' },
    { href: '/characters', label: 'Characters' },
    { href: '/personas', label: 'Personas' },
    { href: '/prompts', label: 'Prompts' },
    { href: '/import-export', label: 'Import/Export' },
    { href: '/llm', label: 'Presets' },
  ];

  return (
    <nav className="bg-dark1 h-16 flex items-center px-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <div className="text-xl font-bold text-white">
            <Link href="/">Chatterbox</Link>
          </div>
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SettingsBox />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
