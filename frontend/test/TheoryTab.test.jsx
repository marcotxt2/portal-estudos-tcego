import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TheoryTab from '../src/components/TheoryTab';

// @spec:AC-002
describe('TheoryTab AC-002 Test', () => {
  it('deve exibir o texto markdown da teoria corretamente na tela', () => {
    const theories = [
      {
        title: 'Governança de TI',
        content_markdown: 'Texto de teste para markdown de teoria'
      }
    ];

    render(<TheoryTab theories={theories} />);
    
    expect(screen.getByText('Governança de TI')).toBeInTheDocument();
    expect(screen.getByText('Texto de teste para markdown de teoria')).toBeInTheDocument();
  });
});
