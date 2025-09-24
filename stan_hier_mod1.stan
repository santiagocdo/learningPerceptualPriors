// perceptual priors model based on Brandon's JTC
data {
  int nSubj;				// number of subjects
  int nTrial;				// number of trials
  int chase[nTrial, nSubj];		// chase (ground truth, trial type)
  int report[nTrial, nSubj];		// report of chase (participant responses)
  int condition[nTrial, nSubj];		// condition volatile (1) or stable (0)
}

parameters {
  // these are the base hyperparameters across all participants _v and _s for each condition

  // averages for hyperparameters, i.e., m_
  real m_wprior_v; 			// mean weight priors
  real m_wlik_v; 			// mean weight likelihood
  real m_lr_v;				// mean learning rate
  real m_wprior_s; 			// mean weight priors
  real m_wlik_s; 			// mean weight likelihood
  real m_lr_s;				// mean learning rate

  // standard deviation for hyperparameters, i.e., sd_
  real<lower=0> sd_wprior_v;
  real<lower=0> sd_wlik_v;
  real<lower=0> sd_lr_v;
  real<lower=0> sd_wprior_s;
  real<lower=0> sd_wlik_s;
  real<lower=0> sd_lr_s;

  // each participant will have a deviation _tilde from the mean
  real wprior_v_tilde[nSubj];
  real wlik_v_tilde[nSubj];
  real lr_v_tilde[nSubj];
  real wprior_s_tilde[nSubj];
  real wlik_s_tilde[nSubj];
  real lr_s_tilde[nSubj];
}

transformed parameters {
  // reparametrize
  real wprior_v[nSubj];
  real wlik_v[nSubj];
  real lr_v[nSubj];
  real wprior_s[nSubj];
  real wlik_s[nSubj];
  real lr_s[nSubj];

  for (s in 1:nSubj) {
    wprior_v[s] = m_wprior_v + sd_wprior_v * wprior_v_tilde[s];
    wlik_v[s]   = m_wlik_v   + sd_wlik_v   * wlik_v_tilde[s];
    lr_v[s]     = m_lr_v     + sd_lr_v     * lr_v_tilde[s];
    wprior_s[s] = m_wprior_s + sd_wprior_s * wprior_s_tilde[s];
    wlik_s[s]   = m_wlik_s   + sd_wlik_s   * wlik_s_tilde[s];
    lr_s[s]     = m_lr_s     + sd_lr_s     * lr_s_tilde[s];
  }
}

model {
  // priors for hyperparameters mean
  m_wprior_v ~ normal(0,5);
  m_wlik_v ~ normal(0,5);
  m_lr_v ~ normal(0,5);
  m_wprior_s ~ normal(0,5);
  m_wlik_s ~ normal(0,5);
  m_lr_s ~ normal(0,5);

  // priors for hyperparameters sd
  sd_wprior_v ~ cauchy(0,5);
  sd_wlik_v ~ cauchy(0,5);
  sd_lr_v ~ cauchy(0,5);
  sd_wprior_s ~ cauchy(0,5);
  sd_wlik_s ~ cauchy(0,5);
  sd_lr_s ~ cauchy(0,5);

  // priors for tilde 
  wprior_v_tilde ~ std_normal();
  wlik_v_tilde ~ std_normal();
  lr_v_tilde ~ std_normal();
  wprior_s_tilde ~ std_normal();
  wlik_s_tilde ~ std_normal();
  lr_s_tilde ~ std_normal();

  // run all subjects
  for (s in 1:nSubj) {
    // parameters irrespectively the condition (see if condition)
    real wprior;
    real wlik;
    real lr;

    // log space likelihood priors and report (response)
    real loglik;
    real logprior;
    real logreport;

    real prior;
    prior = 0.5;

    for (i in 1:nTrial) {

      if (condition[i,s]==1) {
        wprior = wprior_v[s];
        wlik = wlik_v[s];
        lr = lr_v[s];
      } else {
        wprior = wprior_s[s];
        wlik = wlik_s[s];
        lr = lr_s[s];
      } // end if condition


      // if chase = 1, then noise is (1-nu), otherwise (chase = 0) noise is nu
      if (chase[i,s] == 1) {
        loglik = 1 - Phi_approx(wlik);
      } else {
        loglik = Phi_approx(wlik);
      }
      loglik = log( loglik / (1 - loglik) );


      // priors are transformed in log(priors), they cannot be 0 or 1
      if (prior == 1) {
        prior = .999;
      }
      if (prior == 0) {
        prior = .001;
      }     
      logprior = log( (prior) / (1 - prior) );


      // log(report) is proportional to loglikelihood (seen) AND logprior (expectations)
      logreport = loglik + Phi_approx(wprior) * logprior;


      // report is a Bernoulli experiment with p(report) in log as a parameter, logreport=0 is .5
      report[i,s] ~ bernoulli_logit(logreport);


      // if nTrial is middle 49 then new condition (block)
      if (i == 49) {
        prior = 0.5;
      }

      // update priors via prediction error
      prior = prior + Phi_approx(lr) * report[i,s] - prior;

    } // end condition i loop
  } // end subject s loop
}

generated quantities {
  real dif_wprior;
  real dif_wlik;
  real dif_lr;

  dif_wprior = m_wprior_v - m_wprior_s;
  dif_wlik = m_wlik_v - m_wlik_s;
  dif_lr = m_lr_v - m_lr_s;

  // Re-declare the variables here since they are not populated
  // Add a 2D array to store the pointwise log-likelihood (for LOO-CV) for each response trial/subject
  real log_lik[nTrial, nSubj];
  
  // Store the posterior predictions for PPC or for Parameter Recovery (simulate responses)
  real y_sim[nTrial, nSubj];

  // Replicate the loops from the model block to generate quantities
  for (s in 1:nSubj) {
    // parameters irrespective of the condition (see if condition)
    real wprior;
    real wlik;
    real lr;

    // log space likelihood priors and report (response)
    real loglik;
    real logprior;
    real logreport;

    real prior;
    prior = 0.5;

    for (i in 1:nTrial) {
      
      if (condition[i, s] == 1) {
        wprior = wprior_v[s];
        wlik = wlik_v[s];
        lr = lr_v[s];
      } else {
        wprior = wprior_s[s];
        wlik = wlik_s[s];
        lr = lr_s[s];
      }

      if (chase[i, s] == 1) {
        loglik = 1 - Phi_approx(wlik);
      } else {
        loglik = Phi_approx(wlik);
      }
      loglik = log(loglik / (1 - loglik));

      if (prior == 1) {
        prior = 0.999;
      }
      if (prior == 0) {
        prior = 0.001;
      }
      logprior = log(prior / (1 - prior));
      logreport = loglik + Phi_approx(wprior) * logprior;

      // 1. Calculate the pointwise log-likelihood using the _lpdf function
      log_lik[i, s] = bernoulli_logit_lpmf(report[i, s] | logreport);

      // 2. Simulate new responses using the _rng function
      y_sim[i, s] = bernoulli_logit_rng(logreport);

      if (i == 49) {
        prior = 0.5;
      }
      prior = prior + Phi_approx(lr) * report[i, s] - prior;
    } // end trial i loop
  } // end subject s loop
}
