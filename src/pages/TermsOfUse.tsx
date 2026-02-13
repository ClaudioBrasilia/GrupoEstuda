
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';

const TermsOfUse: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-study-primary">Termos de Uso</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o aplicativo Grupo Estuda, você concorda em cumprir e ficar vinculado 
              aos seguintes termos e condições de uso. Se você não concordar com qualquer parte destes 
              termos, não poderá acessar ou usar nosso aplicativo.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">2. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Você é responsável por 
              revisar periodicamente quaisquer alterações. O uso contínuo do aplicativo após a publicação de 
              alterações constitui aceitação dessas alterações.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">3. Uso do Aplicativo</h2>
            <p>
              O Grupo Estuda é uma plataforma de estudo em grupo que permite aos usuários criar grupos, 
              definir metas de estudo e acompanhar seu progresso. O uso do aplicativo está sujeito às 
              seguintes condições:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Você não deve usar o aplicativo para qualquer finalidade ilegal ou não autorizada.</li>
              <li>Você é responsável por todas as atividades que ocorrem sob sua conta.</li>
              <li>Você não deve compartilhar material protegido por direitos autorais sem permissão.</li>
              <li>Você não deve enviar conteúdo abusivo, obsceno, ameaçador ou prejudicial.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">4. Contas de Usuário</h2>
            <p>
              Para usar determinadas funcionalidades do aplicativo, você precisa criar uma conta. Ao criar uma conta, 
              você concorda em fornecer informações precisas e completas. Você é responsável por manter a 
              confidencialidade de sua senha e por restringir o acesso à sua conta.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">5. Assinaturas Premium</h2>
            <p>
              O Grupo Estuda oferece planos de assinatura premium que fornecem acesso a recursos adicionais. 
              As assinaturas são renovadas automaticamente, a menos que você cancele antes do próximo período 
              de faturamento. Reembolsos são processados de acordo com as políticas da App Store e Google Play.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">6. Conteúdo do Usuário</h2>
            <p>
              Ao enviar conteúdo para o aplicativo (fotos, mensagens, etc.), você concede ao Grupo Estuda 
              uma licença mundial, não exclusiva e isenta de royalties para usar, reproduzir e distribuir 
              esse conteúdo em conexão com o serviço.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">7. Limitação de Responsabilidade</h2>
            <p>
              O Grupo Estuda não será responsável por quaisquer danos diretos, indiretos, incidentais ou 
              consequentes resultantes do uso ou da incapacidade de usar o aplicativo.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">8. Lei Aplicável</h2>
            <p>
              Estes termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar 
              conflitos de princípios legais.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contato</h2>
            <p>
              Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco pelo e-mail: 
              contato@grupoestuda.com.br
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

export default TermsOfUse;
