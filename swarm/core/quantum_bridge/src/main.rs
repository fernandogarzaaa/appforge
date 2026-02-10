mod lib;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        println!("{}", lib::version());
        return;
    }

    match args[1].as_str() {
        "resolve" => {
            // resolve id1:score1,id2:score2...
            if args.len() < 3 {
                return;
            }
            let mut options = Vec::new();
            for part in args[2].split(',') {
                let kv: Vec<&str> = part.split(':').collect();
                if kv.len() == 2 {
                    if let Ok(score) = kv[1].parse::<f64>() {
                        options.push(lib::DecisionOption {
                            id: kv[0].to_string(),
                            score,
                        });
                    }
                }
            }
            let res = lib::resolve_quantum_gate(options);
            println!(
                "BEST:{} CONF:{} LATENCY:{}",
                res.best_option_id, res.confidence, res.latency_ns
            );
        }
        _ => println!("Unknown command"),
    }
}
