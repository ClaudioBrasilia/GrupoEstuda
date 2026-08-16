
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';

const PrivacyPolicy: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-study-primary">Política de Privacidade</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <p className="mb-4">
              A sua privacidade é importante para nós. Esta Política de Privacidade explica como o 
              Grupo Estuda coleta, usa e protege suas informações quando você utiliza nosso aplicativo.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Informações que Coletamos</h2>
            <p className="mb-2">Podemos coletar os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Informações de Registro:</strong> Nome, endereço de e-mail e senha quando você 
                cria uma conta.
              </li>
              <li>
                <strong>Informações de Perfil:</strong> Dados que você opta por adicionar ao seu perfil, 
                como foto, biografia e interesses de estudo.
              </li>
              <li>
                <strong>Dados de Uso:</strong> Informações sobre como você usa o aplicativo, incluindo 
                metas de estudo, participação em grupos e interações.
              </li>
              <li>
                <strong>Conteúdo do Usuário:</strong> Qualquer conteúdo que você carrega, como fotos, 
                mensagens e comentários.
              </li>
              <li>
                <strong>Dados do Dispositivo:</strong> Informações técnicas sobre seu dispositivo e 
                conexão de internet.
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">2. Como Usamos Suas Informações</h2>
            <p>Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fornecer, manter e melhorar nossos serviços</li>
              <li>Personalizar sua experiência e oferecer recursos relevantes</li>
              <li>Processar transações de assinatura e enviar notificações relacionadas</li>
              <li>Comunicar-nos com você sobre atualizações e novos recursos</li>
              <li>Analisar tendências e melhorar o desempenho do aplicativo</li>
              <li>Detectar, investigar e prevenir atividades fraudulentas e violações</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">3. Compartilhamento de Informações</h2>
            <p>
              Não vendemos suas informações pessoais a terceiros. Podemos compartilhar informações 
              nas seguintes circunstâncias:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Com outros membros dos grupos de estudo conforme necessário para a funcionalidade do aplicativo</li>
              <li>Com provedores de serviços que nos ajudam a operar o aplicativo</li>
              <li>Para cumprir obrigações legais ou responder a solicitações governamentais</li>
              <li>Se necessário para proteger direitos, propriedade ou segurança</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">4. Segurança de Dados</h2>
            <p>
              Implementamos medidas de segurança para proteger suas informações contra acesso não autorizado, 
              alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela internet 
              ou armazenamento eletrônico é 100% seguro, e não podemos garantir segurança absoluta.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">5. Seus Direitos</h2>
            <p>De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem direito a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Acessar e receber uma cópia de seus dados pessoais</li>
              <li>Retificar dados incorretos ou incompletos</li>
              <li>Solicitar a exclusão de seus dados pessoais</li>
              <li>Restringir ou se opor ao processamento de seus dados</li>
              <li>Transferir seus dados para outro serviço (portabilidade)</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">6. Exclusão da Conta e dos Dados</h2>
            <p className="mb-2">
              Você pode apagar sua conta a qualquer momento, direto no aplicativo, em{' '}
              <strong>Perfil → Configurações → Segurança → Excluir minha conta</strong>.
              A exclusão é imediata e definitiva.
            </p>
            <p className="mb-2">São removidos permanentemente:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Seu perfil e dados de cadastro</li>
              <li>Suas sessões de estudo e histórico de progresso</li>
              <li>Seus pontos, XP, conquistas e medalhas</li>
              <li>Sua participação em grupos e desafios</li>
              <li>As fotos e arquivos que você enviou</li>
            </ul>
            <p className="mt-2">
              Mensagens enviadas em grupos e arquivos compartilhados com um grupo podem
              permanecer visíveis para os demais membros, de forma anonimizada, para
              preservar o histórico da conversa. Se preferir solicitar a exclusão por
              e-mail, escreva para privacidade@grupoestuda.com.br a partir do endereço
              cadastrado — respondemos em até 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Dados de Crianças</h2>
            <p>
              Nossos serviços não são direcionados a menores de 13 anos, e não coletamos intencionalmente 
              informações pessoais de crianças menores de 13 anos. Se descobrirmos que coletamos informações 
              pessoais de uma criança menor de 13 anos, excluiremos essas informações prontamente.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">8. Alterações na Política de Privacidade</h2>
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre 
              quaisquer alterações publicando a nova Política de Privacidade nesta página e, se as alterações 
              forem significativas, enviaremos uma notificação por e-mail ou dentro do aplicativo.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contato</h2>
            <p>
              Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade ou sobre nossas 
              práticas de dados, entre em contato conosco pelo e-mail: privacidade@grupoestuda.com.br
            </p>
          </section>
          
          <p className="pt-4 text-sm text-gray-500">
            Última atualização: 15 de maio de 2025
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;
