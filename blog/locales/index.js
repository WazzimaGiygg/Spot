// ============================================
// GERENCIADOR DE TRADUÇÕES (i18n)
// ============================================

// ============================================
// DICIONÁRIO DE TRADUÇÕES
// ============================================
const LOCALES_DATA = {
    'pt-BR': {
        code: 'pt-BR',
        name: 'Português (Brasil)',
        flag: '🇧🇷',
        translations: {
            'app.title': 'Blog · WazzimaGiygg',
            'app.loading': 'Carregando blog...',
            'app.copiado': '✅ Link copiado!',
            'nav.inicio': 'Início',
            'nav.blog': 'Blog',
            'nav.entrar': 'Entrar',
            'nav.sair': 'Sair',
            'nav.conta': 'Sua conta',
            'nav.produtos': 'Produtos',
            'nav.desktop': 'Desktop',
            'nav.doacao': 'Doação',
            'nav.ticket': 'Ticket',
            'nav.lgpd': 'LGPD',
            'nav.marcoCivil': 'Marco Civil',
            'user.visitante': 'Visitante',
            'user.carregando': 'Carregando...',
            'user.aguarde': 'aguarde',
            'user.banido': '🚫 Banido',
            'user.admin': 'Admin',
            'user.contaBanida': '⚠️ Conta Banida',
            'user.contaBanidaDesc': 'Sua conta foi banida permanentemente do sistema.',
            'user.motivoBan': 'Motivo: Violação das políticas de uso',
            'user.erroBan': 'Se você acredita que isso é um erro, entre em contato com o suporte.',
            'user.sairConta': '🚪 Sair da conta',
            'blog.titulo': 'Blog de ',
            'blog.publico': 'Blog público',
            'blog.seuBlog': 'Seu blog',
            'blog.posts': 'posts',
            'blog.semPosts': 'Nenhuma postagem ainda.',
            'blog.semTitulo': 'Sem título',
            'blog.semConteudo': 'Sem conteúdo.',
            'blog.dataDesconhecida': 'data desconhecida',
            'blog.comentarios': 'Comentários',
            'blog.curtidas': 'Curtidas',
            'blog.publicar': 'Publicar Post',
            'blog.novoPost': 'Novo Post',
            'blog.tituloPost': 'Título do post',
            'blog.conteudoPost': 'Escreva seu post em HTML ou texto...',
            'blog.preview': 'Pré-visualização',
            'blog.atualizaAuto': 'Atualiza automaticamente',
            'editor.escrevaAqui': '✏️ Comece a escrever seu post no editor ao lado...',
            'editor.html': 'HTML',
            'editor.texto': 'Texto',
            'editor.permitirComentarios': 'Permitir comentários',
            'editor.permitirCurtidas': 'Permitir curtidas',
            'editor.publicar': 'Publicar',
            'editor.editando': 'Editar',
            'editor.excluir': 'Excluir',
            'editor.editar': 'Editar',
            'editor.confirmarExclusao': 'Excluir esta postagem?',
            'editor.confirmarEdicao': 'Editar: o post atual será removido e um novo será criado.',
            'comments.placeholder': 'Escreva um comentário...',
            'comments.comentar': 'Comentar',
            'comments.loginParaComentar': 'Faça login para comentar.',
            'comments.erroComentar': 'Erro ao comentar: ',
            'share.compartilhar': 'Compartilhar',
            'share.copiarLink': 'Copiar link',
            'share.linkCopiado': '✅ Link copiado para a área de transferência!',
            'share.whatsapp': 'WhatsApp',
            'share.twitter': 'Twitter',
            'share.facebook': 'Facebook',
            'share.linkedin': 'LinkedIn',
            'share.telegram': 'Telegram',
            'share.email': 'E-mail',
            'cookies.titulo': '🍪 Nós usamos cookies',
            'cookies.descricao': 'Este site utiliza cookies para melhorar sua experiência, analisar tráfego e exibir anúncios personalizados. Ao continuar navegando, você concorda com nossa ',
            'cookies.politica': 'Política de Privacidade',
            'cookies.essenciais': '🔒 Essenciais (obrigatórios)',
            'cookies.analise': '📊 Análise de dados',
            'cookies.publicidade': '🎯 Publicidade personalizada',
            'cookies.aceitarTodos': '✅ Aceitar Todos',
            'cookies.recusarTodos': '❌ Recusar Todos',
            'cookies.personalizar': '⚙️ Personalizar',
            'cookies.preferenciasSalvas': '✅ Suas preferências foram salvas!',
            'cookies.cookiesAceitos': '✅ Todos os cookies foram aceitos!',
            'cookies.cookiesRecusados': 'ℹ️ Cookies não essenciais foram recusados.',
            'notifications.titulo': '🔔 Notificações',
            'notifications.marcarLidas': 'Marcar todas como lidas',
            'notifications.nenhuma': 'Nenhuma notificação',
            'notifications.notificacao': 'Notificação',
            'login.titulo': 'Entrar',
            'login.descricao': 'Faça login para criar posts e interagir',
            'login.google': 'Entrar com Google',
            'login.ou': 'ou',
            'login.email': 'E-mail',
            'login.senha': 'Senha',
            'login.entrar': 'Entrar com e-mail',
            'login.criarConta': 'Criar nova conta',
            'login.erroLogin': 'Erro ao fazer login: ',
            'login.erroCriar': 'Erro ao criar conta: ',
            'login.contaCriada': 'Conta criada com sucesso!',
            'login.senhaMinima': 'A senha deve ter pelo menos 6 caracteres',
            'pagination.anterior': 'Anterior',
            'pagination.proximo': 'Próximo',
            'pagination.pagina': 'Página',
            'pagination.de': 'de',
            'footer.direitos': '© 2026 WazzimaGiygg Blog - Compartilhe conhecimento',
            'toast.erro': 'Erro',
            'toast.sucesso': 'Sucesso',
            'toast.info': 'Informação'
        }
    },
    'en-US': {
        code: 'en-US',
        name: 'English (US)',
        flag: '🇺🇸',
        translations: {
            'app.title': 'Blog · WazzimaGiygg',
            'app.loading': 'Loading blog...',
            'app.copiado': '✅ Link copied!',
            'nav.inicio': 'Home',
            'nav.blog': 'Blog',
            'nav.entrar': 'Login',
            'nav.sair': 'Logout',
            'nav.conta': 'Your account',
            'nav.produtos': 'Products',
            'nav.desktop': 'Desktop',
            'nav.doacao': 'Donation',
            'nav.ticket': 'Ticket',
            'nav.lgpd': 'Privacy Policy',
            'nav.marcoCivil': 'Civil Rights',
            'user.visitante': 'Visitor',
            'user.carregando': 'Loading...',
            'user.aguarde': 'please wait',
            'user.banido': '🚫 Banned',
            'user.admin': 'Admin',
            'user.contaBanida': '⚠️ Banned Account',
            'user.contaBanidaDesc': 'Your account has been permanently banned from the system.',
            'user.motivoBan': 'Reason: Violation of usage policies',
            'user.erroBan': 'If you believe this is a mistake, please contact support.',
            'user.sairConta': '🚪 Logout',
            'blog.titulo': 'Blog of ',
            'blog.publico': 'Public blog',
            'blog.seuBlog': 'Your blog',
            'blog.posts': 'posts',
            'blog.semPosts': 'No posts yet.',
            'blog.semTitulo': 'Untitled',
            'blog.semConteudo': 'No content.',
            'blog.dataDesconhecida': 'unknown date',
            'blog.comentarios': 'Comments',
            'blog.curtidas': 'Likes',
            'blog.publicar': 'Publish Post',
            'blog.novoPost': 'New Post',
            'blog.tituloPost': 'Post title',
            'blog.conteudoPost': 'Write your post in HTML or text...',
            'blog.preview': 'Preview',
            'blog.atualizaAuto': 'Auto-updates',
            'editor.escrevaAqui': '✏️ Start writing your post in the editor on the right...',
            'editor.html': 'HTML',
            'editor.texto': 'Text',
            'editor.permitirComentarios': 'Allow comments',
            'editor.permitirCurtidas': 'Allow likes',
            'editor.publicar': 'Publish',
            'editor.editando': 'Edit',
            'editor.excluir': 'Delete',
            'editor.editar': 'Edit',
            'editor.confirmarExclusao': 'Delete this post?',
            'editor.confirmarEdicao': 'Edit: the current post will be removed and a new one created.',
            'comments.placeholder': 'Write a comment...',
            'comments.comentar': 'Comment',
            'comments.loginParaComentar': 'Please login to comment.',
            'comments.erroComentar': 'Error commenting: ',
            'share.compartilhar': 'Share',
            'share.copiarLink': 'Copy link',
            'share.linkCopiado': '✅ Link copied to clipboard!',
            'share.whatsapp': 'WhatsApp',
            'share.twitter': 'Twitter',
            'share.facebook': 'Facebook',
            'share.linkedin': 'LinkedIn',
            'share.telegram': 'Telegram',
            'share.email': 'E-mail',
            'cookies.titulo': '🍪 We use cookies',
            'cookies.descricao': 'This site uses cookies to improve your experience, analyze traffic, and display personalized ads. By continuing to browse, you agree to our ',
            'cookies.politica': 'Privacy Policy',
            'cookies.essenciais': '🔒 Essential (required)',
            'cookies.analise': '📊 Analytics',
            'cookies.publicidade': '🎯 Personalized advertising',
            'cookies.aceitarTodos': '✅ Accept All',
            'cookies.recusarTodos': '❌ Reject All',
            'cookies.personalizar': '⚙️ Customize',
            'cookies.preferenciasSalvas': '✅ Your preferences have been saved!',
            'cookies.cookiesAceitos': '✅ All cookies accepted!',
            'cookies.cookiesRecusados': 'ℹ️ Non-essential cookies rejected.',
            'notifications.titulo': '🔔 Notifications',
            'notifications.marcarLidas': 'Mark all as read',
            'notifications.nenhuma': 'No notifications',
            'notifications.notificacao': 'Notification',
            'login.titulo': 'Login',
            'login.descricao': 'Login to create posts and interact',
            'login.google': 'Sign in with Google',
            'login.ou': 'or',
            'login.email': 'Email',
            'login.senha': 'Password',
            'login.entrar': 'Sign in with email',
            'login.criarConta': 'Create new account',
            'login.erroLogin': 'Error logging in: ',
            'login.erroCriar': 'Error creating account: ',
            'login.contaCriada': 'Account created successfully!',
            'login.senhaMinima': 'Password must be at least 6 characters',
            'pagination.anterior': 'Previous',
            'pagination.proximo': 'Next',
            'pagination.pagina': 'Page',
            'pagination.de': 'of',
            'footer.direitos': '© 2026 WazzimaGiygg Blog - Share knowledge',
            'toast.erro': 'Error',
            'toast.sucesso': 'Success',
            'toast.info': 'Information'
        }
    },
    'es-ES': {
        code: 'es-ES',
        name: 'Español',
        flag: '🇪🇸',
        translations: {
            'app.title': 'Blog · WazzimaGiygg',
            'app.loading': 'Cargando blog...',
            'app.copiado': '✅ ¡Enlace copiado!',
            'nav.inicio': 'Inicio',
            'nav.blog': 'Blog',
            'nav.entrar': 'Entrar',
            'nav.sair': 'Salir',
            'nav.conta': 'Tu cuenta',
            'nav.produtos': 'Productos',
            'nav.desktop': 'Escritorio',
            'nav.doacao': 'Donación',
            'nav.ticket': 'Ticket',
            'nav.lgpd': 'Política de privacidad',
            'nav.marcoCivil': 'Marco Civil',
            'user.visitante': 'Visitante',
            'user.carregando': 'Cargando...',
            'user.aguarde': 'espera',
            'user.banido': '🚫 Baneado',
            'user.admin': 'Admin',
            'user.contaBanida': '⚠️ Cuenta Baneada',
            'user.contaBanidaDesc': 'Tu cuenta ha sido baneada permanentemente del sistema.',
            'user.motivoBan': 'Motivo: Violación de las políticas de uso',
            'user.erroBan': 'Si crees que esto es un error, contacta con soporte.',
            'user.sairConta': '🚪 Salir de la cuenta',
            'blog.titulo': 'Blog de ',
            'blog.publico': 'Blog público',
            'blog.seuBlog': 'Tu blog',
            'blog.posts': 'publicaciones',
            'blog.semPosts': 'Sin publicaciones aún.',
            'blog.semTitulo': 'Sin título',
            'blog.semConteudo': 'Sin contenido.',
            'blog.dataDesconhecida': 'fecha desconocida',
            'blog.comentarios': 'Comentarios',
            'blog.curtidas': 'Me gusta',
            'blog.publicar': 'Publicar',
            'blog.novoPost': 'Nueva Publicación',
            'blog.tituloPost': 'Título',
            'blog.conteudoPost': 'Escribe en HTML o texto...',
            'blog.preview': 'Vista previa',
            'blog.atualizaAuto': 'Actualización automática',
            'editor.escrevaAqui': '✏️ Empieza a escribir en el editor de la derecha...',
            'editor.html': 'HTML',
            'editor.texto': 'Texto',
            'editor.permitirComentarios': 'Permitir comentarios',
            'editor.permitirCurtidas': 'Permitir me gusta',
            'editor.publicar': 'Publicar',
            'editor.editando': 'Editar',
            'editor.excluir': 'Eliminar',
            'editor.editar': 'Editar',
            'editor.confirmarExclusao': '¿Eliminar esta publicación?',
            'editor.confirmarEdicao': 'Editar: la publicación actual será eliminada y se creará una nueva.',
            'comments.placeholder': 'Escribe un comentario...',
            'comments.comentar': 'Comentar',
            'comments.loginParaComentar': 'Inicia sesión para comentar.',
            'comments.erroComentar': 'Error al comentar: ',
            'share.compartilhar': 'Compartir',
            'share.copiarLink': 'Copiar enlace',
            'share.linkCopiado': '✅ ¡Enlace copiado al portapapeles!',
            'share.whatsapp': 'WhatsApp',
            'share.twitter': 'Twitter',
            'share.facebook': 'Facebook',
            'share.linkedin': 'LinkedIn',
            'share.telegram': 'Telegram',
            'share.email': 'Correo',
            'cookies.titulo': '🍪 Usamos cookies',
            'cookies.descricao': 'Este sitio utiliza cookies para mejorar tu experiencia, analizar tráfico y mostrar anuncios personalizados. Al continuar navegando, aceptas nuestra ',
            'cookies.politica': 'Política de Privacidad',
            'cookies.essenciais': '🔒 Esenciales (obligatorias)',
            'cookies.analise': '📊 Análisis',
            'cookies.publicidade': '🎯 Publicidad personalizada',
            'cookies.aceitarTodos': '✅ Aceptar todas',
            'cookies.recusarTodos': '❌ Rechazar todas',
            'cookies.personalizar': '⚙️ Personalizar',
            'cookies.preferenciasSalvas': '✅ ¡Tus preferencias fueron guardadas!',
            'cookies.cookiesAceitos': '✅ ¡Todas las cookies aceptadas!',
            'cookies.cookiesRecusados': 'ℹ️ Cookies no esenciales rechazadas.',
            'notifications.titulo': '🔔 Notificaciones',
            'notifications.marcarLidas': 'Marcar todas como leídas',
            'notifications.nenhuma': 'Sin notificaciones',
            'notifications.notificacao': 'Notificación',
            'login.titulo': 'Iniciar sesión',
            'login.descricao': 'Inicia sesión para crear publicaciones e interactuar',
            'login.google': 'Entrar con Google',
            'login.ou': 'o',
            'login.email': 'Correo',
            'login.senha': 'Contraseña',
            'login.entrar': 'Entrar con correo',
            'login.criarConta': 'Crear nueva cuenta',
            'login.erroLogin': 'Error al iniciar sesión: ',
            'login.erroCriar': 'Error al crear cuenta: ',
            'login.contaCriada': '¡Cuenta creada exitosamente!',
            'login.senhaMinima': 'La contraseña debe tener al menos 6 caracteres',
            'pagination.anterior': 'Anterior',
            'pagination.proximo': 'Siguiente',
            'pagination.pagina': 'Página',
            'pagination.de': 'de',
            'footer.direitos': '© 2026 WazzimaGiygg Blog - Comparte conocimiento',
            'toast.erro': 'Error',
            'toast.sucesso': 'Éxito',
            'toast.info': 'Información'
        }
    },
    'fr-FR': {
        code: 'fr-FR',
        name: 'Français',
        flag: '🇫🇷',
        translations: {
            'app.title': 'Blog · WazzimaGiygg',
            'app.loading': 'Chargement du blog...',
            'app.copiado': '✅ Lien copié !',
            'nav.inicio': 'Accueil',
            'nav.blog': 'Blog',
            'nav.entrar': 'Connexion',
            'nav.sair': 'Déconnexion',
            'nav.conta': 'Votre compte',
            'nav.produtos': 'Produits',
            'nav.desktop': 'Bureau',
            'nav.doacao': 'Don',
            'nav.ticket': 'Ticket',
            'nav.lgpd': 'Politique de confidentialité',
            'nav.marcoCivil': 'Marco Civil',
            'user.visitante': 'Visiteur',
            'user.carregando': 'Chargement...',
            'user.aguarde': 'veuillez patienter',
            'user.banido': '🚫 Banni',
            'user.admin': 'Admin',
            'user.contaBanida': '⚠️ Compte banni',
            'user.contaBanidaDesc': 'Votre compte a été banni définitivement du système.',
            'user.motivoBan': 'Motif: Violation des politiques d\'utilisation',
            'user.erroBan': 'Si vous pensez qu\'il s\'agit d\'une erreur, contactez le support.',
            'user.sairConta': '🚪 Se déconnecter',
            'blog.titulo': 'Blog de ',
            'blog.publico': 'Blog public',
            'blog.seuBlog': 'Votre blog',
            'blog.posts': 'articles',
            'blog.semPosts': 'Aucun article pour le moment.',
            'blog.semTitulo': 'Sans titre',
            'blog.semConteudo': 'Aucun contenu.',
            'blog.dataDesconhecida': 'date inconnue',
            'blog.comentarios': 'Commentaires',
            'blog.curtidas': 'J\'aime',
            'blog.publicar': 'Publier',
            'blog.novoPost': 'Nouvel article',
            'blog.tituloPost': 'Titre',
            'blog.conteudoPost': 'Écrivez en HTML ou texte...',
            'blog.preview': 'Aperçu',
            'blog.atualizaAuto': 'Mise à jour automatique',
            'editor.escrevaAqui': '✏️ Commencez à écrire dans l\'éditeur à droite...',
            'editor.html': 'HTML',
            'editor.texto': 'Texte',
            'editor.permitirComentarios': 'Autoriser les commentaires',
            'editor.permitirCurtidas': 'Autoriser les likes',
            'editor.publicar': 'Publier',
            'editor.editando': 'Modifier',
            'editor.excluir': 'Supprimer',
            'editor.editar': 'Modifier',
            'editor.confirmarExclusao': 'Supprimer cet article ?',
            'editor.confirmarEdicao': 'Modifier : l\'article actuel sera supprimé et un nouveau créé.',
            'comments.placeholder': 'Écrivez un commentaire...',
            'comments.comentar': 'Commenter',
            'comments.loginParaComentar': 'Connectez-vous pour commenter.',
            'comments.erroComentar': 'Erreur lors du commentaire : ',
            'share.compartilhar': 'Partager',
            'share.copiarLink': 'Copier le lien',
            'share.linkCopiado': '✅ Lien copié dans le presse-papier !',
            'share.whatsapp': 'WhatsApp',
            'share.twitter': 'Twitter',
            'share.facebook': 'Facebook',
            'share.linkedin': 'LinkedIn',
            'share.telegram': 'Telegram',
            'share.email': 'E-mail',
            'cookies.titulo': '🍪 Nous utilisons des cookies',
            'cookies.descricao': 'Ce site utilise des cookies pour améliorer votre expérience, analyser le trafic et afficher des publicités personnalisées. En continuant à naviguer, vous acceptez notre ',
            'cookies.politica': 'Politique de confidentialité',
            'cookies.essenciais': '🔒 Essentiels (obligatoires)',
            'cookies.analise': '📊 Analyse',
            'cookies.publicidade': '🎯 Publicité personnalisée',
            'cookies.aceitarTodos': '✅ Tout accepter',
            'cookies.recusarTodos': '❌ Tout refuser',
            'cookies.personalizar': '⚙️ Personnaliser',
            'cookies.preferenciasSalvas': '✅ Vos préférences ont été enregistrées !',
            'cookies.cookiesAceitos': '✅ Tous les cookies acceptés !',
            'cookies.cookiesRecusados': 'ℹ️ Cookies non essentiels refusés.',
            'notifications.titulo': '🔔 Notifications',
            'notifications.marcarLidas': 'Tout marquer comme lu',
            'notifications.nenhuma': 'Aucune notification',
            'notifications.notificacao': 'Notification',
            'login.titulo': 'Connexion',
            'login.descricao': 'Connectez-vous pour créer des articles et interagir',
            'login.google': 'Se connecter avec Google',
            'login.ou': 'ou',
            'login.email': 'E-mail',
            'login.senha': 'Mot de passe',
            'login.entrar': 'Se connecter avec e-mail',
            'login.criarConta': 'Créer un nouveau compte',
            'login.erroLogin': 'Erreur de connexion : ',
            'login.erroCriar': 'Erreur de création de compte : ',
            'login.contaCriada': 'Compte créé avec succès !',
            'login.senhaMinima': 'Le mot de passe doit contenir au moins 6 caractères',
            'pagination.anterior': 'Précédent',
            'pagination.proximo': 'Suivant',
            'pagination.pagina': 'Page',
            'pagination.de': 'de',
            'footer.direitos': '© 2026 WazzimaGiygg Blog - Partagez le savoir',
            'toast.erro': 'Erreur',
            'toast.sucesso': 'Succès',
            'toast.info': 'Information'
        }
    },
    'de-DE': {
        code: 'de-DE',
        name: 'Deutsch',
        flag: '🇩🇪',
        translations: {
            'app.title': 'Blog · WazzimaGiygg',
            'app.loading': 'Blog wird geladen...',
            'app.copiado': '✅ Link kopiert!',
            'nav.inicio': 'Start',
            'nav.blog': 'Blog',
            'nav.entrar': 'Anmelden',
            'nav.sair': 'Abmelden',
            'nav.conta': 'Ihr Konto',
            'nav.produtos': 'Produkte',
            'nav.desktop': 'Desktop',
            'nav.doacao': 'Spenden',
            'nav.ticket': 'Ticket',
            'nav.lgpd': 'Datenschutz',
            'nav.marcoCivil': 'Grundrechte',
            'user.visitante': 'Besucher',
            'user.carregando': 'Lädt...',
            'user.aguarde': 'bitte warten',
            'user.banido': '🚫 Gesperrt',
            'user.admin': 'Admin',
            'user.contaBanida': '⚠️ Konto gesperrt',
            'user.contaBanidaDesc': 'Ihr Konto wurde dauerhaft aus dem System gesperrt.',
            'user.motivoBan': 'Grund: Verstoß gegen die Nutzungsrichtlinien',
            'user.erroBan': 'Wenn Sie glauben, dass dies ein Fehler ist, kontaktieren Sie den Support.',
            'user.sairConta': '🚪 Abmelden',
            'blog.titulo': 'Blog von ',
            'blog.publico': 'Öffentlicher Blog',
            'blog.seuBlog': 'Ihr Blog',
            'blog.posts': 'Beiträge',
            'blog.semPosts': 'Keine Beiträge bisher.',
            'blog.semTitulo': 'Ohne Titel',
            'blog.semConteudo': 'Kein Inhalt.',
            'blog.dataDesconhecida': 'unbekanntes Datum',
            'blog.comentarios': 'Kommentare',
            'blog.curtidas': 'Gefällt mir',
            'blog.publicar': 'Veröffentlichen',
            'blog.novoPost': 'Neuer Beitrag',
            'blog.tituloPost': 'Titel',
            'blog.conteudoPost': 'In HTML oder Text schreiben...',
            'blog.preview': 'Vorschau',
            'blog.atualizaAuto': 'Automatische Aktualisierung',
            'editor.escrevaAqui': '✏️ Beginnen Sie im Editor auf der rechten Seite zu schreiben...',
            'editor.html': 'HTML',
            'editor.texto': 'Text',
            'editor.permitirComentarios': 'Kommentare erlauben',
            'editor.permitirCurtidas': 'Likes erlauben',
            'editor.publicar': 'Veröffentlichen',
            'editor.editando': 'Bearbeiten',
            'editor.excluir': 'Löschen',
            'editor.editar': 'Bearbeiten',
            'editor.confirmarExclusao': 'Diesen Beitrag löschen?',
            'editor.confirmarEdicao': 'Bearbeiten: Der aktuelle Beitrag wird entfernt und ein neuer erstellt.',
            'comments.placeholder': 'Schreiben Sie einen Kommentar...',
            'comments.comentar': 'Kommentieren',
            'comments.loginParaComentar': 'Bitte anmelden zum Kommentieren.',
            'comments.erroComentar': 'Fehler beim Kommentieren: ',
            'share.compartilhar': 'Teilen',
            'share.copiarLink': 'Link kopieren',
            'share.linkCopiado': '✅ Link in die Zwischenablage kopiert!',
            'share.whatsapp': 'WhatsApp',
            'share.twitter': 'Twitter',
            'share.facebook': 'Facebook',
            'share.linkedin': 'LinkedIn',
            'share.telegram': 'Telegram',
            'share.email': 'E-Mail',
            'cookies.titulo': '🍪 Wir verwenden Cookies',
            'cookies.descricao': 'Diese Website verwendet Cookies, um Ihre Erfahrung zu verbessern, den Verkehr zu analysieren und personalisierte Anzeigen zu schalten. Durch die weitere Nutzung stimmen Sie unserer ',
            'cookies.politica': 'Datenschutzrichtlinie',
            'cookies.essenciais': '🔒 Essenziell (erforderlich)',
            'cookies.analise': '📊 Analyse',
            'cookies.publicidade': '🎯 Personalisierte Werbung',
            'cookies.aceitarTodos': '✅ Alle akzeptieren',
            'cookies.recusarTodos': '❌ Alle ablehnen',
            'cookies.personalizar': '⚙️ Anpassen',
            'cookies.preferenciasSalvas': '✅ Ihre Einstellungen wurden gespeichert!',
            'cookies.cookiesAceitos': '✅ Alle Cookies akzeptiert!',
            'cookies.cookiesRecusados': 'ℹ️ Nicht-essenzielle Cookies abgelehnt.',
            'notifications.titulo': '🔔 Benachrichtigungen',
            'notifications.marcarLidas': 'Alle als gelesen markieren',
            'notifications.nenhuma': 'Keine Benachrichtigungen',
            'notifications.notificacao': 'Benachrichtigung',
            'login.titulo': 'Anmelden',
            'login.descricao': 'Melden Sie sich an, um Beiträge zu erstellen und zu interagieren',
            'login.google': 'Mit Google anmelden',
            'login.ou': 'oder',
            'login.email': 'E-Mail',
            'login.senha': 'Passwort',
            'login.entrar': 'Mit E-Mail anmelden',
            'login.criarConta': 'Neues Konto erstellen',
            'login.erroLogin': 'Fehler bei der Anmeldung: ',
            'login.erroCriar': 'Fehler bei der Kontoerstellung: ',
            'login.contaCriada': 'Konto erfolgreich erstellt!',
            'login.senhaMinima': 'Das Passwort muss mindestens 6 Zeichen lang sein',
            'pagination.anterior': 'Zurück',
            'pagination.proximo': 'Weiter',
            'pagination.pagina': 'Seite',
            'pagination.de': 'von',
            'footer.direitos': '© 2026 WazzimaGiygg Blog - Wissen teilen',
            'toast.erro': 'Fehler',
            'toast.sucesso': 'Erfolg',
            'toast.info': 'Information'
        }
    }
};

// ============================================
// LISTA DE IDIOMAS PARA O SELETOR
// ============================================
const LANGUAGE_LIST = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' }
];

// ============================================
// VARIÁVEIS DE ESTADO
// ============================================
const DEFAULT_LOCALE = 'pt-BR';
const STORAGE_KEY = 'blog_user_locale';
let currentLocale = DEFAULT_LOCALE;
let currentTranslations = LOCALES_DATA[DEFAULT_LOCALE].translations;

// ============================================
// FUNÇÃO DE TRADUÇÃO
// ============================================
function t(key) {
    if (currentTranslations && currentTranslations[key]) {
        return currentTranslations[key];
    }
    // Fallback para português
    const fallback = LOCALES_DATA['pt-BR'].translations[key];
    return fallback || key;
}

// ============================================
// FUNÇÃO PARA MUDAR IDIOMA
// ============================================
function setLocale(localeCode) {
    if (!LOCALES_DATA[localeCode]) {
        console.warn(`⚠️ Idioma "${localeCode}" não disponível`);
        return false;
    }
    
    currentLocale = localeCode;
    currentTranslations = LOCALES_DATA[localeCode].translations;
    localStorage.setItem(STORAGE_KEY, localeCode);
    document.documentElement.lang = localeCode;
    
    // Atualiza o seletor
    updateLanguageSelector();
    
    // Aplica traduções
    applyTranslations();
    
    // Atualiza título da página
    document.title = t('app.title');
    
    console.log(`🌍 Idioma alterado: ${localeCode}`);
    return true;
}

// ============================================
// APLICA TRADUÇÕES AOS ELEMENTOS
// ============================================
function applyTranslations() {
    // Traduz elementos com data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation && translation !== key) {
            el.textContent = translation;
        }
    });
    
    // Traduz elementos com data-i18n-html
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const translation = t(key);
        if (translation && translation !== key) {
            el.innerHTML = translation;
        }
    });
    
    // Traduz placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        if (translation && translation !== key) {
            el.placeholder = translation;
        }
    });
    
    // Traduz títulos
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translation = t(key);
        if (translation && translation !== key) {
            el.title = translation;
        }
    });
    
    // Título da página
    document.title = t('app.title');
}

// ============================================
// INJETA O SELETOR DE IDIOMA NO HEADER
// ============================================
function injectLanguageSelector() {
    const userInfo = document.querySelector('.user-info-header');
    if (!userInfo) {
        console.warn('⚠️ .user-info-header não encontrado');
        return;
    }
    
    // Remove se já existir
    const existing = document.getElementById('languageSelector');
    if (existing) existing.remove();
    
    const currentLocale = localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE;
    const currentLang = LOCALES_DATA[currentLocale];
    const flag = currentLang.flag || '🌍';
    const code = currentLocale.split('-')[0];
    
    // Cria o seletor
    const selector = document.createElement('div');
    selector.id = 'languageSelector';
    selector.className = 'language-selector';
    
    let optionsHtml = '';
    for (const langCode of Object.keys(LOCALES_DATA)) {
        const lang = LOCALES_DATA[langCode];
        const active = langCode === currentLocale ? 'active' : '';
        optionsHtml += `
            <button class="lang-option ${active}" 
                    data-lang="${langCode}"
                    onclick="window.setLocale('${langCode}')">
                <span class="lang-flag">${lang.flag}</span>
                <span class="lang-name">${lang.name}</span>
            </button>
        `;
    }
    
    selector.innerHTML = `
        <button class="lang-btn" onclick="toggleLanguageDropdown(event)">
            <span class="lang-flag">${flag}</span>
            <span class="lang-code">${code}</span>
            <span class="lang-arrow">▾</span>
        </button>
        <div class="lang-dropdown" id="langDropdown">
            ${optionsHtml}
        </div>
    `;
    
    // Insere antes do botão de login
    const loginBtn = document.getElementById('btnLogin');
    if (loginBtn) {
        userInfo.insertBefore(selector, loginBtn);
    } else {
        userInfo.appendChild(selector);
    }
    
    console.log('✅ Seletor de idioma injetado no header');
}

// ============================================
// ALTERNA O DROPDOWN DO SELETOR
// ============================================
function toggleLanguageDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('langDropdown');
    const btn = document.querySelector('.lang-btn');
    if (dropdown && btn) {
        dropdown.classList.toggle('show');
        btn.classList.toggle('open');
    }
}

// ============================================
// ATUALIZA O SELETOR DE IDIOMA
// ============================================
function updateLanguageSelector() {
    const btn = document.querySelector('.lang-btn');
    if (btn) {
        const currentLang = LOCALES_DATA[currentLocale];
        btn.innerHTML = `
            <span class="lang-flag">${currentLang.flag}</span>
            <span class="lang-code">${currentLocale.split('-')[0]}</span>
            <span class="lang-arrow">▾</span>
        `;
    }
    
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === currentLocale);
    });
}

// ============================================
// INICIALIZAÇÃO DO SISTEMA
// ============================================
function initI18n() {
    // Tenta carregar o idioma salvo
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES_DATA[saved]) {
        currentLocale = saved;
    } else {
        // Tenta detectar o idioma do navegador
        const browserLang = navigator.language || navigator.languages?.[0] || DEFAULT_LOCALE;
        const langCode = Object.keys(LOCALES_DATA).find(key => key === browserLang) || 
                         Object.keys(LOCALES_DATA).find(key => key.startsWith(browserLang.split('-')[0])) || 
                         DEFAULT_LOCALE;
        currentLocale = langCode;
        localStorage.setItem(STORAGE_KEY, langCode);
    }
    
    currentTranslations = LOCALES_DATA[currentLocale].translations;
    document.documentElement.lang = currentLocale;
    
    // Injeta o seletor no header
    injectLanguageSelector();
    
    // Aplica as traduções iniciais
    applyTranslations();
    
    // Adiciona os estilos do seletor
    injectLanguageStyles();
    
    // Configura evento para fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.language-selector')) {
            const dropdown = document.getElementById('langDropdown');
            const btn = document.querySelector('.lang-btn');
            if (dropdown) dropdown.classList.remove('show');
            if (btn) btn.classList.remove('open');
        }
    });
    
    console.log(`🌍 Sistema de internacionalização carregado!`);
    console.log(`📋 Idioma atual: ${currentLocale} (${LOCALES_DATA[currentLocale].name})`);
}

// ============================================
// INJETA OS ESTILOS DO SELETOR
// ============================================
function injectLanguageStyles() {
    const styleId = 'language-selector-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .language-selector {
            position: relative;
            display: inline-block;
        }
        
        .lang-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.75em;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        
        .lang-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        
        .lang-btn .lang-arrow {
            font-size: 0.6em;
            transition: transform 0.3s;
        }
        
        .lang-btn.open .lang-arrow {
            transform: rotate(180deg);
        }
        
        .lang-dropdown {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            min-width: 200px;
            background: #1a1a2e;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 6px 0;
            z-index: 9999;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
        
        .lang-dropdown.show {
            display: block;
        }
        
        .lang-option {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 16px;
            width: 100%;
            border: none;
            background: transparent;
            color: #ccc;
            cursor: pointer;
            font-size: 0.85em;
            transition: all 0.2s;
            font-family: 'Lato', sans-serif;
        }
        
        .lang-option:hover {
            background: rgba(255,255,255,0.05);
            color: white;
        }
        
        .lang-option.active {
            background: rgba(74, 158, 255, 0.15);
            color: #4a9eff;
        }
        
        .lang-option .lang-flag {
            font-size: 1.1em;
        }
        
        .lang-option .lang-name {
            white-space: nowrap;
        }
        
        .lang-code {
            font-weight: 500;
        }
        
        .lang-flag {
            font-size: 1em;
        }
        
        @media (max-width: 768px) {
            .lang-btn .lang-code {
                display: none;
            }
            .lang-dropdown {
                right: -10px;
                min-width: 160px;
            }
        }
        
        @media (max-width: 480px) {
            .lang-btn .lang-code,
            .lang-btn .lang-arrow {
                display: none;
            }
            .lang-dropdown {
                right: -20px;
                min-width: 140px;
            }
            .lang-option .lang-name {
                font-size: 0.8em;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// EXPORTA FUNÇÕES PARA USO GLOBAL
// ============================================
window.t = t;
window.setLocale = setLocale;
window.toggleLanguageDropdown = toggleLanguageDropdown;
window.LOCALES_DATA = LOCALES_DATA;
window.LANGUAGE_LIST = LANGUAGE_LIST;
window.currentLocale = () => currentLocale;
window.currentTranslations = () => currentTranslations;
window.initI18n = initI18n;

console.log('🌍 Sistema de internacionalização carregado!');
