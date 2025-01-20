import Link from 'next/link';
import { useRouter } from 'next/router';
import SettingsBox from './SettingsBox';

const Navbar = () => {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Conversations' },
    { href: '/characters', label: 'Characters' },
    { href: '/personas', label: 'Personas' },
    { href: '/prompts', label: 'Prompts' },
    { href: '/import-export', label: 'Import/Export' },
    { href: '/llm', label: 'Presets' },
  ];

  return (
    <nav className="bg-dark1 h-16 flex items-center px-6">
      <div className="container mx-auto flex justify-between items-center">
        {/* Left side: Site name and Links */}
        <div className="flex items-center space-x-8">
          {/* Site Name */}
          <div className="text-xl font-bold text-white">
            <Link href="/">Chatterbox</Link>
          </div>
          {/* Links */}
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side: Model Search */}
        <div>
          <SettingsBox />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
