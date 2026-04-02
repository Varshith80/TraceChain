/**
 * Hyperledger Fabric initialization (fabric-network SDK)
 *
 * This module connects once on startup and reuses the connection globally.
 * It is aligned to the classic `fabric-network` Gateway API (not @hyperledger/fabric-gateway).
 */

import { Gateway, Network, Wallets, type Wallet } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger.js';

// Singleton instances for connection reuse
let gateway: Gateway | null = null;
let network: Network | null = null;
let wallet: Wallet | null = null;

// Configuration from environment
interface FabricConfig {
  peerEndpoint: string;
  chaincodeName: string;
  channelName: string;
  connectionProfilePath: string;
  walletPath: string;
  identityLabel: string;
  asLocalhost: boolean;
  mspId: string;
}

function loadFabricConfig(): FabricConfig {
  const config: FabricConfig = {
    peerEndpoint: process.env.FABRIC_PEER_ENDPOINT || '',
    chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'productledger',
    channelName: process.env.FABRIC_CHANNEL_NAME || 'productledger-channel',
    connectionProfilePath: process.env.FABRIC_CONNECTION_PROFILE || '',
    walletPath: process.env.FABRIC_WALLET_PATH || path.join(process.cwd(), 'wallet'),
    identityLabel: process.env.FABRIC_IDENTITY_LABEL || 'appUser',
    asLocalhost: process.env.FABRIC_AS_LOCALHOST !== 'false',
    mspId: process.env.FABRIC_MSP_ID || 'Org1MSP',
  };

  // Validate required configuration
  if (!config.connectionProfilePath) {
    throw new Error('FABRIC_CONNECTION_PROFILE is required (e.g. ./connection-org1.json).');
  }

  return config;
}

/**
 * Load connection profile with TLS configuration
 */
function loadConnectionProfile(profilePath: string): any {
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Connection profile not found: ${profilePath}`);
  }

  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  return profile;
}

/**
 * Resolve cert/key files for identity label.
 * Supports both:
 * - Flat:   <wallet>/<label>-cert.pem, <wallet>/<label>-key.pem
 * - Nested: <wallet>/<label>/<label>-cert.pem, <wallet>/<label>/<label>-key.pem
 * - Fabric Admin: FABRIC_CRYPTO_PATH/peerOrganizations/org1.example.com/users/Admin@org1.example.com/
 */
function resolveIdentityFiles(
  walletPath: string,
  label: string,
  cryptoPath?: string
): { certPath: string; keyPath: string } {
  // Option: Load Admin from Fabric test-network crypto materials (guaranteed channel access)
  if (cryptoPath && (label === 'Admin' || label === 'admin')) {
    const adminBase = path.join(
      cryptoPath,
      'peerOrganizations',
      'org1.example.com',
      'users',
      'Admin@org1.example.com',
      'msp'
    );
    const certPath = path.join(adminBase, 'signcerts', 'cert.pem');
    const keystoreDir = path.join(adminBase, 'keystore');
    if (fs.existsSync(certPath) && fs.existsSync(keystoreDir)) {
      const keyFiles = fs.readdirSync(keystoreDir).filter((f) => f.endsWith('_sk') || f.endsWith('.pem'));
      if (keyFiles.length > 0) {
        return { certPath, keyPath: path.join(keystoreDir, keyFiles[0]) };
      }
    }
  }

  const nested = {
    certPath: path.join(walletPath, label, `${label}-cert.pem`),
    keyPath: path.join(walletPath, label, `${label}-key.pem`),
  };
  if (fs.existsSync(nested.certPath) && fs.existsSync(nested.keyPath)) return nested;

  const flat = {
    certPath: path.join(walletPath, `${label}-cert.pem`),
    keyPath: path.join(walletPath, `${label}-key.pem`),
  };
  if (fs.existsSync(flat.certPath) && fs.existsSync(flat.keyPath)) return flat;

  throw new Error(
    `Identity files not found for "${label}". Expected either ` +
      `"${nested.certPath}" + "${nested.keyPath}" OR "${flat.certPath}" + "${flat.keyPath}".`
  );
}

/**
 * Get gateway instance (connection reuse)
 */
export function getGateway(): Gateway {
  if (!gateway) {
    throw new Error('Fabric gateway not initialized. Call initializeFabric() first.');
  }
  return gateway;
}

/**
 * Get network instance (connection reuse)
 */
export function getNetwork(): Network {
  if (!network) {
    throw new Error('Fabric network not initialized. Call initializeFabric() first.');
  }
  return network;
}

/**
 * Initialize Fabric connection with secure identity management
 */
export async function initializeFabric(): Promise<void> {
  try {
    const config = loadFabricConfig();

    logger.info('Initializing Hyperledger Fabric connection...');
    logger.info(`Channel: ${config.channelName}`);
    logger.info(`Chaincode: ${config.chaincodeName}`);
    logger.info(`Identity: ${config.identityLabel}`);
    logger.info(`MSP: ${config.mspId}`);

    // Load connection profile
    const connectionProfile = loadConnectionProfile(config.connectionProfilePath);
    logger.info(`Connection profile loaded from: ${config.connectionProfilePath}`);

    // Build a wallet from PEM files
    // Use Admin from FABRIC_CRYPTO_PATH for guaranteed channel access (fixes "access denied")
    const cryptoPath = process.env.FABRIC_CRYPTO_PATH
      ? path.resolve(process.env.FABRIC_CRYPTO_PATH)
      : undefined;
    const useAdmin = process.env.FABRIC_USE_ADMIN_IDENTITY === 'true';

    if (!wallet) {
      wallet = await Wallets.newInMemoryWallet();
      const identityLabel = useAdmin && cryptoPath ? 'Admin' : config.identityLabel;
      const files = resolveIdentityFiles(
        path.resolve(config.walletPath),
        identityLabel,
        useAdmin ? cryptoPath : undefined
      );
      const certificate = fs.readFileSync(files.certPath, 'utf8');
      const privateKey = fs.readFileSync(files.keyPath, 'utf8');

      const walletLabel = useAdmin && cryptoPath ? 'Admin' : config.identityLabel;
      await wallet.put(walletLabel, {
        credentials: { certificate, privateKey },
        mspId: config.mspId,
        type: 'X.509',
      } as any);
      logger.info(
        `✅ Wallet identity loaded (${walletLabel}${useAdmin && cryptoPath ? ' from Fabric crypto)' : ' from PEM files)'}`
      );
    }

    // Create gateway connection (singleton - connection reuse)
    if (!gateway) {
      const gw = new Gateway();
      const walletLabel = useAdmin && cryptoPath ? 'Admin' : config.identityLabel;
      const discoveryEnabled = process.env.FABRIC_DISCOVERY_ENABLED !== 'false';
      if (!discoveryEnabled) {
        logger.info('Discovery disabled - using static connection profile');
      }
      await gw.connect(connectionProfile, {
        wallet,
        identity: walletLabel,
        discovery: {
          enabled: discoveryEnabled,
          asLocalhost: config.asLocalhost,
        },
      });
      gateway = gw;
      logger.info('✅ Gateway connected successfully');
    }

    // Get network (connection reuse)
    if (!network && gateway) {
      network = await gateway.getNetwork(config.channelName);
      logger.info(`✅ Network "${config.channelName}" connected`);
    }

    // Test connection
    if (!network) {
      throw new Error('Network not initialized');
    }
    const contract = network.getContract(config.chaincodeName);
    try {
      await contract.evaluateTransaction('GetMegaQR', 'test-connection');
    } catch (error: any) {
      // Expected to fail, but confirms chaincode is accessible
      if (!error.message?.includes('does not exist')) {
        logger.warn('Chaincode connection test returned unexpected error:', error.message);
      }
    }

    logger.info('✅ Hyperledger Fabric connection initialized successfully');
    logger.info('✅ Blockchain is now the source of truth for product data');
    logger.info('✅ Connection reuse enabled for optimal performance');
  } catch (error: any) {
    logger.error('❌ Failed to initialize Fabric:', error?.message || error);
    logger.error('Fabric connection is REQUIRED - mock mode is not allowed');
    throw error;
  }
}

/**
 * Close Fabric connection
 */
export async function closeFabric(): Promise<void> {
  if (gateway) {
    gateway.disconnect();
    gateway = null;
    network = null;
    wallet = null;
    logger.info('Fabric connection closed');
  }
}
