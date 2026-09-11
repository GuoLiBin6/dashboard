import { typeClouds } from '@/utils/common/hypervisor'
import { arrayToObj } from '@/utils/utils'
import i18n from '@/locales'
import aliyunLogo from '@/assets/images/providers/aliyun.svg'
import awsLogo from '@/assets/images/providers/aws.svg'
import azureLogo from '@/assets/images/providers/azure.svg'
import huaweiLogo from '@/assets/images/providers/huawei.svg'
import qcloudLogo from '@/assets/images/providers/qcloud.svg'
import ucloudLogo from '@/assets/images/providers/ucloud.svg'
import rockbaseLogo from '@/assets/images/providers/rockbase.svg'
import vmwareLogo from '@/assets/images/providers/vmware.svg'
import openstackLogo from '@/assets/images/providers/openstack.svg'
// import dstackLogo from '@/assets/images/providers/dstack.svg'
import zstackLogo from '@/assets/images/providers/zstack.svg'
import s3Logo from '@/assets/images/providers/s3.svg'
import cephLogo from '@/assets/images/providers/ceph.svg'
import xskyLogo from '@/assets/images/providers/xsky.svg'
import googleLogo from '@/assets/images/providers/gcp.svg'
import ctyunLogo from '@/assets/images/providers/tianyi.svg'
import apsaraLogo from '@/assets/images/providers/apsara.svg'
import ecloudLogo from '@/assets/images/providers/ecloud.svg'
import jdcloudLogo from '@/assets/images/providers/jdcloud.svg'
import cloudpodsLogo from '@/assets/images/providers/cloudpods.svg'
import hcsoLogo from '@/assets/images/providers/hcso.svg'
import hcsLogo from '@/assets/images/providers/huawei.svg'
import nutanixLogo from '@/assets/images/providers/nutanix.svg'
import bingocloudLogo from '@/assets/images/providers/bingocloud.svg'
import incloudsphereLogo from '@/assets/images/providers/incloudsphere.svg'
import remotefileLogo from '@/assets/images/providers/remotefile.svg'
import proxmoxLogo from '@/assets/images/providers/proxmox.svg'
import h3cLogo from '@/assets/images/providers/h3c.svg'
import ksyunLogo from '@/assets/images/providers/ksyun.svg'
import baiduLogo from '@/assets/images/providers/baidu.svg'
import qingcloudLogo from '@/assets/images/providers/qingcloud.svg'
import chinaUnionLogo from '@/assets/images/providers/chinaunion.svg'
import volcEngineLogo from '@/assets/images/providers/volcengine.svg'
import oraclecloudLogo from '@/assets/images/providers/oraclecloud.svg'
import sangforLogo from '@/assets/images/providers/sangfor.svg'
import zettakitLogo from '@/assets/images/providers/zettakit.svg'
import uisLogo from '@/assets/images/providers/uis.svg'
import casLogo from '@/assets/images/providers/cas.svg'
import cloudflareLogo from '@/assets/images/providers/cloudflare.svg'
import cnwareLogo from '@/assets/images/providers/cnware.svg'
import oceanbaseLogo from '@/assets/images/providers/oceanbase.svg'

const providerMap = typeClouds.getProviderlowcase()

export const CLOUDACCOUNT_TYPES = {
  public: {
    aliyun: {
      name: providerMap.aliyun.label,
      logo: aliyunLogo,
      component: 'AliyunCreate',
      provider: providerMap.aliyun.key,
    },
    aws: {
      name: providerMap.aws.label,
      logo: awsLogo,
      component: 'AwsCreate',
      provider: providerMap.aws.key,
    },
    azure: {
      name: providerMap.azure.label,
      logo: azureLogo,
      component: 'AzureCreate',
      provider: providerMap.azure.key,
    },
    huawei: {
      name: providerMap.huawei.label,
      logo: huaweiLogo,
      component: 'HuaweiCreate',
      provider: providerMap.huawei.key,
      logoStyle: {
        position: 'relative',
        top: '3px',
      },
    },
    qcloud: {
      name: providerMap.qcloud.label,
      logo: qcloudLogo,
      component: 'QcloudCreate',
      provider: providerMap.qcloud.key,
    },
    ucloud: {
      name: providerMap.ucloud.label,
      logo: ucloudLogo,
      component: 'UcloudCreate',
      provider: providerMap.ucloud.key,
    },
    rockbase: {
      name: providerMap.rockbase.label,
      logo: rockbaseLogo,
      component: 'RockBaseCreate',
      provider: providerMap.rockbase.key,
    },
    google: {
      name: providerMap.google.label,
      logo: googleLogo,
      component: 'GoogleCreate',
      provider: providerMap.google.key,
    },
    ctyun: {
      name: providerMap.ctyun.label,
      logo: ctyunLogo,
      component: 'CtyunCreate',
      provider: providerMap.ctyun.key,
    },
    ecloud: {
      name: providerMap.ecloud.label,
      logo: ecloudLogo,
      component: 'EcloudCreate',
      provider: providerMap.ecloud.key,
    },
    jdcloud: {
      name: providerMap.jdcloud.label,
      logo: jdcloudLogo,
      component: 'JDcloudCreate',
      provider: providerMap.jdcloud.key,
    },
    baidu: {
      name: providerMap.baidu.label,
      logo: baiduLogo,
      component: 'BaiduCloudCreate',
      provider: providerMap.baidu.key,
    },
    ksyun: {
      name: providerMap.ksyun.label,
      logo: ksyunLogo,
      component: 'KsyunCreate',
      provider: providerMap.ksyun.key,
    },
    qingcloud: {
      name: providerMap.qingcloud.label,
      logo: qingcloudLogo,
      component: 'QingcloudCreate',
      provider: providerMap.qingcloud.key,
    },
    chinaunion: {
      name: providerMap.chinaunion.label,
      logo: chinaUnionLogo,
      component: 'chinaUnionCreate',
      provider: providerMap.chinaunion.key,
    },
    volcengine: {
      name: providerMap.volcengine.label,
      logo: volcEngineLogo,
      component: 'volcEngineCreate',
      provider: providerMap.volcengine.key,
    },
    oraclecloud: {
      name: providerMap.oraclecloud.label,
      logo: oraclecloudLogo,
      component: 'OracleCloudCreate',
      provider: providerMap.oraclecloud.key,
      logoStyle: {
        position: 'relative',
        right: '1px',
        width: '28px',
      },
    },
    cloudflare: {
      name: providerMap.cloudflare.label,
      logo: cloudflareLogo,
      component: 'CloudflareCreate',
      provider: providerMap.cloudflare.key,
      hiddenName: true,
      logoStyle: {
        width: '100px',
        height: '24px',
      },
    },
    oceanbase: {
      name: providerMap.oceanbase.label,
      logo: oceanbaseLogo,
      component: 'OceanbaseCreate',
      provider: providerMap.oceanbase.key,
      hiddenName: true,
      logoStyle: {
        width: '100px',
        height: '25px',
      },
    },
  },
  private: {
    vmware: {
      name: providerMap.vmware.label,
      logo: vmwareLogo,
      component: 'VMwareCreate',
      provider: providerMap.vmware.key,
    },
    openstack: {
      name: providerMap.openstack.label,
      logo: openstackLogo,
      component: 'OpenstackCreate',
      provider: providerMap.openstack.key,
    },
    // dstack: {
    //   name: providerMap.dstack.label,
    //   logo: dstackLogo,
    //   component: 'DstackCreate',
    //   provider: providerMap.dstack.key,
    // },
    zstack: {
      name: providerMap.zstack.label,
      logo: zstackLogo,
      component: 'ZstackCreate',
      provider: providerMap.zstack.key,
    },
    apsara: {
      name: providerMap.apsara.label,
      logo: apsaraLogo,
      component: 'ApsaraCreate',
      provider: providerMap.apsara.key,
    },
    cloudpods: {
      name: providerMap.cloudpods.label,
      logo: cloudpodsLogo,
      component: 'CloudpodsCreate',
      provider: providerMap.cloudpods.key,
    },
    hcso: {
      name: providerMap.hcso.label,
      logo: hcsoLogo,
      component: 'HCSOCreate',
      provider: providerMap.hcso.key,
    },
    hcs: {
      name: providerMap.hcs.label,
      logo: hcsLogo,
      component: 'HCSCreate',
      provider: providerMap.hcs.key,
      logoStyle: {
        position: 'relative',
        top: '3px',
      },
    },
    nutanix: {
      name: providerMap.nutanix.label,
      logo: nutanixLogo,
      component: 'NutanixCreate',
      provider: providerMap.nutanix.key,
    },
    bingocloud: {
      name: providerMap.bingocloud.label,
      logo: bingocloudLogo,
      component: 'BingoCloudCreate',
      provider: providerMap.bingocloud.key,
      hiddenName: true,
      logoStyle: {
        width: '100px',
        height: '24px',
      },
    },
    incloudsphere: {
      name: providerMap.incloudsphere.label,
      logo: incloudsphereLogo,
      component: 'InCloudSphereCreate',
      provider: providerMap.incloudsphere.key,
      hiddenName: true,
      logoStyle: {
        width: '100px',
        height: '24px',
      },
    },
    remotefile: {
      name: providerMap.remotefile.label,
      logo: remotefileLogo,
      component: 'RemoteFileCreate',
      provider: providerMap.remotefile.key,
    },
    proxmox: {
      name: providerMap.proxmox.label,
      logo: proxmoxLogo,
      component: 'ProxmoxCreate',
      provider: providerMap.proxmox.key,
    },
    h3c: {
      name: providerMap.h3c.label,
      logo: h3cLogo,
      component: 'H3CCreate',
      provider: providerMap.h3c.key,
    },
    sangfor: {
      name: providerMap.sangfor.label,
      logo: sangforLogo,
      component: 'SangforCreate',
      provider: providerMap.sangfor.key,
    },
    zettakit: {
      name: providerMap.zettakit.label,
      logo: zettakitLogo,
      component: 'ZettaKitCreate',
      provider: providerMap.zettakit.key,
      hiddenName: true,
      logoStyle: {
        width: '100px',
        height: '24px',
      },
    },
    uis: {
      name: providerMap.uis.label,
      logo: uisLogo,
      component: 'UISCreate',
      provider: providerMap.uis.key,
      hiddenName: true,
      logoStyle: {
        width: '100px',
        height: '14px',
      },
    },
    cas: {
      name: providerMap.cas.label,
      logo: casLogo,
      component: 'CASCreate',
      provider: providerMap.cas.key,
    },
    cnware: {
      name: providerMap.cnware.label,
      logo: cnwareLogo,
      component: 'CNwareCreate',
      provider: providerMap.cnware.key,
    },
  },
  storage: {
    s3: {
      name: providerMap.s3.label,
      logo: s3Logo,
      component: 'S3Create',
      provider: providerMap.s3.key,
    },
    ceph: {
      name: providerMap.ceph.label,
      logo: cephLogo,
      component: 'CephCreate',
      provider: providerMap.ceph.key,
    },
    cephfs: {
      name: providerMap.cephfs.label,
      logo: cephLogo,
      component: 'CephFSCreate',
      provider: providerMap.cephfs.key,
    },
    xsky: {
      name: providerMap.xsky.label,
      logo: xskyLogo,
      component: 'XskyCreate',
      provider: providerMap.xsky.key,
      hiddenName: true,
      logoStyle: {
        width: '100px',
        height: '16px',
      },
    },
  },
}

export const ENV_TITLE = {
  public: i18n.t('cloudenv.text_122'),
  storage: i18n.t('cloudenv.other'),
  private: i18n.t('cloudenv.text_124'),
}

export const ACCESS_URL = {
  huawei: {
    // InternationalCloud: i18n.t('cloudenv.text_139'),
    ChinaCloud: i18n.t('cloudenv.text_140'),
  },
  aws: {
    InternationalCloud: i18n.t('cloudenv.text_139'),
    ChinaCloud: i18n.t('cloudenv.text_140'),
  },
  azure: {
    AzureChinaCloud: i18n.t('cloudenv.text_140'),
    AzurePublicCloud: i18n.t('cloudenv.text_139'),
    AzureUSGovernmentCloud: i18n.t('cloudenv.text_141'),
    AzureGermanCloud: i18n.t('cloudenv.text_142'),
  },
  ctyun: {
    InternationalCloud: i18n.t('cloudenv.text_139'),
    ChinaCloud: i18n.t('cloudenv.text_140'),
  },
  aliyun: {
    InternationalCloud: i18n.t('cloudenv.international_cloud'),
    FinanceCloud: i18n.t('cloudenv.finance_cloud'),
  },
  ucloud: {},
  rockbase: {},
  ecloud: {},
  jdcloud: {},
}

export const keySecretFields = {
  aliyun: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.text_143'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  qcloud: {
    k: 'secret_id',
    s: 'secret_key',
    text: i18n.t('cloudenv.text_148'),
    placeholder: {
      k: i18n.t('cloudenv.text_149'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  openstack: {
    k: 'username',
    s: 'password',
    text: 'OpenStack',
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  vmware: {
    k: 'username',
    s: 'password',
    text: 'VMware',
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  azure: {
    k: 'client_id',
    s: 'client_secret',
    text: 'Azure',
    placeholder: {
      k: i18n.t('cloudenv.text_152'),
      s: i18n.t('cloudenv.text_153'),
    },
    label: {
      k: i18n.t('cloudenv.text_154'),
      s: i18n.t('cloudenv.text_155'),
    },
  },
  huawei: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.text_156'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  aws: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: 'AWS',
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  ucloud: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: 'UCloud',
    placeholder: {
      k: i18n.t('cloudenv.text_157'),
      s: i18n.t('cloudenv.text_158'),
    },
    label: {
      k: i18n.t('cloudenv.text_159'),
      s: i18n.t('cloudenv.text_160'),
    },
  },
  rockbase: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: 'RockBase',
    placeholder: {
      k: i18n.t('cloudenv.text_157'),
      s: i18n.t('cloudenv.text_158'),
    },
    label: {
      k: i18n.t('cloudenv.text_159'),
      s: i18n.t('cloudenv.text_160'),
    },
  },
  dstack: {
    k: 'username',
    s: 'password',
    text: 'DStack',
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  zstack: {
    k: 'username',
    s: 'password',
    text: 'ZStack',
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  s3: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: 'S3',
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  ceph: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: 'Ceph',
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  xsky: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: 'XSKY',
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  google: {
    s: 'gcp_private_key',
    k: 'gcp_private_key_id',
    text: 'Google',
    placeholder: {
      s: i18n.t('cloudenv.text_161'),
      k: i18n.t('cloudenv.text_162'),
    },
    label: {
      s: 'private_key',
      k: 'private_key_id',
    },
  },
  ctyun: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.text_163'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  apsara: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudPrvidersMap.Apsara'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  hcso: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudPrvidersMap.HCSO'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  hcs: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudPrvidersMap.HCS'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  ecloud: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.getI18n(['scopeCloudProvidersMap.ecloud', 'scopeProviders.ecloud', 'license.provider.ecloud']),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  jdcloud: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: 'JDcloud',
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  cloudpods: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: 'Cloudpods',
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  nutanix: {
    k: 'username',
    s: 'password',
    text: 'Nutanix',
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  bingocloud: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.bingocloud'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  incloudsphere: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.incloudsphere'),
    placeholder: {
      k: i18n.t('scope.encrypt_key.require_name.prompt'),
      s: i18n.t('scope.encrypt_value.require_name.prompt'),
    },
    label: {
      k: i18n.t('scope.encrypt_key.title.name'),
      s: i18n.t('scope.encrypt_value.title.name'),
    },
  },
  proxmox: {
    k: 'username',
    s: 'password',
    text: 'Proxmox',
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  h3c: {
    k: 'username',
    s: 'password',
    text: 'H3C',
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  zettakit: {
    k: 'username',
    s: 'password',
    text: i18n.t('cloudenv.zettakit'),
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  uis: {
    k: 'username',
    s: 'password',
    text: i18n.t('cloudenv.uis'),
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  cas: {
    k: 'username',
    s: 'password',
    text: i18n.t('cloudenv.cas'),
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  ksyun: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.ksyun'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  baidu: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.baidu'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  oceanbase: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: 'OceanBase',
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  qingcloud: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.qingcloud'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  chinaunion: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.chinaunion'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  volcengine: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('cloudenv.volcengine'),
    placeholder: {
      k: i18n.t('cloudenv.text_144'),
      s: i18n.t('cloudenv.text_145'),
    },
    label: {
      k: i18n.t('cloudenv.text_146'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  cephfs: {
    k: 'username',
    s: 'password',
    text: 'CephFS',
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  oraclecloud: {
    s: 'oracle_tenancy_ocid',
    k: 'oracle_user_ocid',
    text: 'OracleCloud',
    placeholder: {
      s: i18n.t('common.tips.input', ['tenancy']),
      k: i18n.t('common.tips.input', ['user']),
    },
    label: {
      s: 'tenancy',
      k: 'user',
    },
  },
  sangfor: {
    k: 'username',
    s: 'password',
    text: i18n.t('license.provider.sangfor'),
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
  cloudflare: {
    k: 'access_key_id',
    s: 'access_key_secret',
    text: i18n.t('license.provider.cloudflare'),
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('common.tips.input', ['API Key']),
    },
    label: {
      k: i18n.t('cloudenv.text_94'),
      s: 'API Key',
    },
  },
  cnware: {
    k: 'username',
    s: 'password',
    text: i18n.getOemDictionaryI18n('cnware', i18n.t('scopeCloudPrvidersMap.CNware')),
    placeholder: {
      k: i18n.t('cloudenv.text_151'),
      s: i18n.t('cloudenv.text_150'),
    },
    label: {
      k: i18n.t('cloudenv.text_375'),
      s: i18n.t('cloudenv.text_147'),
    },
  },
}

export const notSupportSelectRegion = [
  providerMap.vmware.key,
  providerMap.nutanix.key,
  providerMap.ceph.key,
  providerMap.cephfs.key,
  providerMap.s3.key,
  providerMap.xsky.key,
  providerMap.bingocloud.key,
  providerMap.openstack.key,
  // providerMap.dstack.key,
  providerMap.zstack.key,
  providerMap.apsara.key,
  providerMap.cloudpods.key,
  providerMap.hcso.key,
  providerMap.hcs.key,
  providerMap.incloudsphere.key,
  providerMap.remotefile.key,
  providerMap.h3c.key,
  providerMap.zettakit.key,
  providerMap.uis.key,
  providerMap.cas.key,
  providerMap.proxmox.key,
  providerMap.oraclecloud.key,
  providerMap.cloudflare.key,
]

export const BILL_TYPES = [
  { label: i18n.t('cloudenv.text_344'), value: 'EA' },
  { label: i18n.t('cloudenv.bill_bucket'), value: 'Bucket' },
  { label: i18n.t('cloudenv.api_bill'), value: 'Api' },
]
export const BILL_TYPE_MAP = arrayToObj(BILL_TYPES, 'value')
