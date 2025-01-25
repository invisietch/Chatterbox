import React from 'react';

interface FormattedTextProps {
  t: string;
}

const FormattedText: React.FC<FormattedTextProps> = ({ t }) => {
  return (
    <>
      {t &&
        t.split(/\n/).map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < t.split(/\n/).length - 1 && <br />}
          </React.Fragment>
        ))}
    </>
  );
};

export default FormattedText;
