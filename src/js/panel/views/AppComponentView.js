/* NOTA BENE: il metodo passato deve esser già stato fetchato / con dati validi. */

define(["backbone", "underscore", "jquery", "views/containers/AppComponentActionsView"],
function(Backbone, _, $, AppComponentActionsView) {
	
	var AppComponentView = Backbone.View.extend({

		template: undefined,
		tagName: "li",

		appComponentActionsView: undefined, // oggetto di tipo AppComponentActionsView

		initialize: function(options) {
			_.bindAll(this);

			// crea la vista per le azioni del componente
			this.appComponentActionsView = new AppComponentActionsView({
				collection: this.model.actions
			});

			this.listenTo(this.model, "change", this.render);

			// permette al componente di reagire ogni volta che viene aggiunta una sua nuova azione
			// (ad es. per calcolare un cambiamento di stato del componente)
			this.handleActions(); // per le azioni già esistenti
			this.listenTo(this.model.actions, "reset", this.handleActions);
			this.listenTo(this.model.actions, "add", this.handleAction);


			this.render();
		},

		// agisce sulle azioni correnti
		handleActions: function() {
			var actions = this.model.actions.models;
			for (var i=0,l=actions.length; i<l; i++) {
				this.handleAction(actions[i]);
			}
		},

		handleAction: function(action) {
			// il default è nessuna operazione, i sottotipi possono sovrascrivere il metodo con la propria logica
		},

		// restituisce i dati per il template, può essere sovrascritta dai sottotipi
		// per aumentarne / modificarne i dati restituiti.
		templateData: function() {
			var templateData = this.model.toJSON();
			// mantiene aperta la vista se lo era
			var isOpen = false;
			var appComponentEl = this.$(".appComponent");
			if (appComponentEl) { // la vista è già stata renderizzata precedentemente
				isOpen = appComponentEl.hasClass("in");
			}
			templateData["isOpen"] = isOpen;

			return templateData;
		},

		render: function() {
			this.el.innerHTML = this.template(this.templateData()); // NON usare this.$el.html() che disattiva gli event handler jquery delle sottoviste esistenti

			// inserisce la vista con le azioni del componente
			this.$(".appComponentActions").append(this.appComponentActionsView.el);

			return this;
		},

		open: function() {
			this.$(".appComponent").addClass("in");
			this.render();
		},

		close: function() {
			this.$(".appComponent").removeClass("in");
			// boostrap non collapsa automaticamente l'elemento target, è necessaria una render
			this.render();
		},

		highlightAnimation: function() {
			var animatedEl = this.$(".appComponentToggle");
			
			animatedEl.addClass("highlight");
			animatedEl.one("webkitAnimationEnd", _.bind(function() {
				animatedEl.removeClass("highlight");
			}, this));
		},

		printAppComponent: function() {
			this.model.printThis();
		}

    });
    return AppComponentView;
});