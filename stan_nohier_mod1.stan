// perceptual priors model based on Brandon's JTC
data {
  int<lower=1> nSubj;				// number of subjects
  int<lower=1> nTrial;				// number of trials
  int<lower=0,upper=1>  chase[nTrial, nSubj];	// chase (ground truth, trial type)
  int<lower=0,upper=1>  report[nTrial, nSubj];	// report of chase (participant responses)
  int<lower=0,upper=1>  condition[nTrial, nSubj];// condition volatile (1) or stable (0)
}

parameters {
  // each participant will have a deviation _tilde from the mean
  real wprior_v[nSubj];
  real wlik_v[nSubj];
  real lr_v[nSubj];
  real wprior_s[nSubj];
  real wlik_s[nSubj];
  real lr_s[nSubj];
}

model {
  // priors for tilde 
  wprior_v ~ std_normal();
  wlik_v ~ std_normal();
  lr_v ~ std_normal();
  wprior_s ~ std_normal();
  wlik_s ~ std_normal();
  lr_s ~ std_normal();

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
