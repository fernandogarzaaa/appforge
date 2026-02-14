use quantum_core::QuantumOracle;
use std::env;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: qcore \"<code>\"");
        process::exit(1);
    }

    let code = &args[1];

    match QuantumOracle::validate(code) {
        Ok(_) => {
            println!("SUCCESS: Logic Verified by Q-Core.");
        }
        Err(violation) => {
            println!("{}", violation);
            process::exit(1);
        }
    }
}
